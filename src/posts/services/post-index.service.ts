import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ElasticsearchService } from '../../elasticsearch/services/elasticsearch.service';
import { ES_INDICES } from '../../elasticsearch/enums/indices';
import { computeDocHash } from '../../elasticsearch/utils/hash.util';
import { PostSearchDocument } from '../../elasticsearch/mappings/posts.mapping';
import { PostEntity } from '../entities/post.entity';

@Injectable()
export class PostIndexService {
  private readonly logger = new Logger(PostIndexService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  toDocument(post: PostEntity): PostSearchDocument {
    const fields: Omit<PostSearchDocument, '_hash'> = {
      id: post.id,
      title: post.title,
      content: post.content,
      slug: post.slug,
      status: post.status,
      paymentStatus: post.paymentStatus,
      viewCount: post.viewCount,
      readingTimeMinutes: post.readingTimeMinutes,
      commentCount: post.commentCount,
      averageRating: post.averageRating ?? null,
      author: { id: post.author.id, name: post.author.name },
      categories: (post.categories ?? []).map((category) => ({ id: category.id, name: category.name })),
      createdAt: new Date(post.createdAt).toISOString(),
      updatedAt: new Date(post.updatedAt).toISOString(),
    };

    return { ...fields, _hash: computeDocHash(fields) };
  }

  /**
   * Re-fetches the post with its author/categories relations and (re)indexes it — the single
   * place `author.name`/`categories.name` get denormalized onto the ES document, so every
   * caller (create/update/comment-aggregate-change) goes through here rather than duplicating
   * the join logic.
   */
  async reindexOne(postId: number): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { id: postId }, relations: ['author', 'categories'] });
    if (!post) {
      this.logger.warn(`reindexOne called for missing post ${postId}`);
      return;
    }

    await this.elasticsearchService.indexDocument(ES_INDICES.Posts, post.id, this.toDocument(post));
  }

  async deletePost(postId: number): Promise<void> {
    await this.elasticsearchService.deleteDocument(ES_INDICES.Posts, postId);
  }
}
