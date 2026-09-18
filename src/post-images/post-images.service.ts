import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { createLogger } from '../utils/logger';

import { PostImageEntity } from './entities/post-image.entity';
import { PostImageInput } from './dto/post-image.input';
import { StorageService } from '../storage/storage.service';
import { MAX_UPLOAD_SIZE_BYTES } from '../storage/constants/common';

@Injectable()
export class PostImagesService {
  private readonly logger = createLogger(PostImagesService.name);

  constructor(
    @InjectRepository(PostImageEntity)
    private postImagesRepository: Repository<PostImageEntity>,
    private storageService: StorageService,
  ) {}

  findByPostId(postId: number): Promise<PostImageEntity | null> {
    return this.postImagesRepository.findOneBy({ postId });
  }

  /**
   * `manager` lets a caller already inside a `DataSource.transaction(...)` block (e.g.
   * `PostsService.create`) pass its transactional `EntityManager` through, so the FK reference to
   * `postId` resolves against the same not-yet-committed transaction instead of a separate
   * connection that can't see the uncommitted post row yet.
   */
  async upsertForPost(postId: number, input: PostImageInput, manager?: EntityManager): Promise<PostImageEntity> {
    await this.storageService.verifyUploadedObject(input.key, input.mimeType, MAX_UPLOAD_SIZE_BYTES);

    const repo = manager?.getRepository(PostImageEntity) ?? this.postImagesRepository;
    const existing = await repo.findOneBy({ postId });
    const url = this.storageService.buildPublicUrl(input.key);

    const entity = repo.create({ ...existing, ...input, url, postId });
    const saved = await repo.save(entity);

    if (existing && existing.key !== input.key) {
      try {
        await this.storageService.deleteObject(existing.key);
      } catch (err) {
        this.logger.error(err);
      }
    }

    return saved;
  }
}
