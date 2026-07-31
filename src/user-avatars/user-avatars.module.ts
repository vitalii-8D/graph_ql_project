import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserAvatarEntity } from './entities/user-avatar.entity';
import { UserAvatarsService } from './user-avatars.service';
import { UserAvatarsResolver } from './user-avatars.resolver';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvatarEntity]), StorageModule],
  providers: [UserAvatarsService, UserAvatarsResolver],
  exports: [UserAvatarsService],
})
export class UserAvatarsModule {}
