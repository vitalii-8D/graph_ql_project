import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createLogger } from '../utils/logger';

import { UserAvatarEntity } from './entities/user-avatar.entity';
import { UserAvatarInput } from './dto/user-avatar.input';
import { StorageService } from '../storage/storage.service';

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
    const existing = await this.findByUserId(userId);

    if (existing && existing.key !== input.key) {
      try {
        await this.storageService.deleteObject(existing.key);
      } catch (err) {
        this.logger.error(err);
      }
    }

    const entity = this.userAvatarsRepository.create({ ...existing, ...input, userId });

    return this.userAvatarsRepository.save(entity);
  }
}
