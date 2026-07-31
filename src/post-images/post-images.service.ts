import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createLogger } from '../utils/logger';

import { PostImageEntity } from './entities/post-image.entity';
import { PostImageInput } from './dto/post-image.input';
import { StorageService } from '../storage/storage.service';

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

  async upsertForPost(postId: number, input: PostImageInput): Promise<PostImageEntity> {
    const existing = await this.findByPostId(postId);

    if (existing && existing.key !== input.key) {
      try {
        await this.storageService.deleteObject(existing.key);
      } catch (err) {
        this.logger.error(err);
      }
    }

    const entity = this.postImagesRepository.create({ ...existing, ...input, postId });

    return this.postImagesRepository.save(entity);
  }
}
