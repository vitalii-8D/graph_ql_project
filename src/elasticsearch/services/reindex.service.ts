import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { UserIndexService } from '../../users/services/user-index.service';
import { PostIndexService } from '../../posts/services/post-index.service';
import { CommentIndexService } from '../../comments/comment-index.service';
import { ElasticsearchService } from './elasticsearch.service';
import { ES_INDICES } from '../enums/indices';
import { usersMapping } from '../mappings/users.mapping';
import { postsMapping } from '../mappings/posts.mapping';
import { commentsMapping } from '../mappings/comments.mapping';

const BATCH_SIZE = 500;

interface ReindexOptions {
  recreate?: boolean;
}

@Injectable()
export class ReindexService {
  private readonly logger = new Logger(ReindexService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity) private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(CommentEntity) private readonly commentsRepository: Repository<CommentEntity>,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly userIndexService: UserIndexService,
    private readonly postIndexService: PostIndexService,
    private readonly commentIndexService: CommentIndexService,
  ) {}

  async run(targets: ES_INDICES[], options: ReindexOptions = {}): Promise<void> {
    for (const target of targets) {
      await this.reindexTarget(target, options);
    }
  }

  private async reindexTarget(target: ES_INDICES, options: ReindexOptions): Promise<void> {
    const { index, mapping } = this.indexFor(target);

    if (options.recreate) {
      await this.elasticsearchService.client.indices.delete({ index, ignore_unavailable: true });
    }
    await this.elasticsearchService.ensureIndex(index, mapping);

    let skip = 0;
    let indexed = 0;
    let skippedUnchanged = 0;

    for (;;) {
      const batch = await this.fetchBatch(target, skip, BATCH_SIZE);
      if (batch.length === 0) {
        break;
      }

      const docs = batch.map((entity) => this.toDoc(target, entity));
      const existingHashes = options.recreate
        ? new Map<string, string>()
        : await this.fetchExistingHashes(
            index,
            docs.map((d) => String(d.id)),
          );

      const operations: object[] = [];
      for (const doc of docs) {
        const existingHash = existingHashes.get(String(doc.id));
        if (existingHash === doc._hash) {
          skippedUnchanged += 1;
          continue;
        }

        operations.push({ index: { _index: index, _id: String(doc.id) } });
        operations.push(doc);
        indexed += 1;
      }

      await this.elasticsearchService.bulk(operations);

      skip += BATCH_SIZE;
    }

    this.logger.log(`[${target}] indexed=${indexed} skipped(unchanged)=${skippedUnchanged}`);
  }

  private indexFor(target: ES_INDICES) {
    switch (target) {
      case ES_INDICES.Users:
        return { index: ES_INDICES.Users, mapping: usersMapping };
      case ES_INDICES.Posts:
        return { index: ES_INDICES.Posts, mapping: postsMapping };
      case ES_INDICES.Comments:
        return { index: ES_INDICES.Comments, mapping: commentsMapping };
    }
  }

  private async fetchBatch(
    target: ES_INDICES,
    skip: number,
    take: number,
  ): Promise<(UserEntity | PostEntity | CommentEntity)[]> {
    switch (target) {
      case ES_INDICES.Users:
        return this.usersRepository.find({ skip, take, order: { id: 'ASC' } });
      case ES_INDICES.Posts:
        return this.postsRepository.find({ skip, take, order: { id: 'ASC' }, relations: ['author', 'categories'] });
      case ES_INDICES.Comments:
        return this.commentsRepository.find({ skip, take, order: { id: 'ASC' } });
    }
  }

  private toDoc(target: ES_INDICES, entity: UserEntity | PostEntity | CommentEntity): { id: number; _hash: string } {
    switch (target) {
      case ES_INDICES.Users:
        return this.userIndexService.toDocument(entity as UserEntity);
      case ES_INDICES.Posts:
        return this.postIndexService.toDocument(entity as PostEntity);
      case ES_INDICES.Comments:
        return this.commentIndexService.toDocument(entity as CommentEntity);
    }
  }

  private async fetchExistingHashes(index: string, ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) {
      return new Map();
    }

    try {
      const response = await this.elasticsearchService.client.mget<{ _hash: string }>({
        index,
        ids,
      });

      const hashes = new Map<string, string>();
      for (const doc of response.docs) {
        if ('found' in doc && doc.found && doc._source?._hash) {
          hashes.set(doc._id, doc._source._hash);
        }
      }

      return hashes;
    } catch {
      return new Map();
    }
  }
}
