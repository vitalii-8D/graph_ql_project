import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostImageEntity } from './entities/post-image.entity';
import { PostImagesService } from './post-images.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostImageEntity]), StorageModule],
  providers: [PostImagesService],
  exports: [PostImagesService],
})
export class PostImagesModule {}
