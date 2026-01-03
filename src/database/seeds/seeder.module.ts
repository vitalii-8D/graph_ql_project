import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeederService } from './seeder.service';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { OpenGraphMetadataEntity } from '../../open-graph/entities/open-graph-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PostEntity, CategoryEntity, OpenGraphMetadataEntity])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
