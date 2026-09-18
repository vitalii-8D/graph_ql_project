import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createLogger } from '../utils/logger';

import { UserAvatarEntity } from './entities/user-avatar.entity';
import { UserAvatarInput } from './dto/user-avatar.input';
import { StorageService } from '../storage/storage.service';
import { MAX_UPLOAD_SIZE_BYTES } from '../storage/constants/common';

@Injectable()
export class UserAvatarsService {
  private readonly logger = createLogger(UserAvatarsService.name);

  constructor(
    @InjectRepository(UserAvatarEntity)
    private userAvatarsRepository: Repository<UserAvatarEntity>,
    private storageService: StorageService,
  ) {}

  findByUserId(userId: number): Promise<UserAvatarEntity | null> {
    return this.userAvatarsRepository.findOneBy({ userId });
  }

  async upsertForUser(userId: number, input: UserAvatarInput): Promise<UserAvatarEntity> {
    await this.storageService.verifyUploadedObject(input.key, input.mimeType, MAX_UPLOAD_SIZE_BYTES);

    const existing = await this.findByUserId(userId);
    const url = this.storageService.buildPublicUrl(input.key);

    const entity = this.userAvatarsRepository.create({ ...existing, ...input, url, userId });
    const saved = await this.userAvatarsRepository.save(entity);

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
