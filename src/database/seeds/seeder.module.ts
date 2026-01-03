import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeederService } from './seeder.service';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Category } from '../../categories/entities/category.entity';
import { OpenGraphMetadata } from '../../open-graph/entities/open-graph-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post, Category, OpenGraphMetadata])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
