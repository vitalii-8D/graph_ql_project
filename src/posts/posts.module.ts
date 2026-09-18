import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsService } from './services/posts.service';
import { PostSearchService } from './services/post-search.service';
import { PostsResolver } from './posts.resolver';
import { PostIndexService } from './services/post-index.service';
import { ViewCountDedupeService } from './services/view-count-dedupe.service';
import { PostEntity } from './entities/post.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { OpenGraphModule } from '../open-graph/open-graph.module';
import { PostImagesModule } from '../post-images/post-images.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, CategoryEntity, UserEntity]), OpenGraphModule, PostImagesModule],
  providers: [PostsResolver, PostsService, PostSearchService, PostIndexService, ViewCountDedupeService],
  exports: [PostsService, PostSearchService, PostIndexService],
})
export class PostsModule {}
