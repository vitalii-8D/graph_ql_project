import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PostsWebController } from './posts-web.controller';
import { Post } from './entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category, User])],
  controllers: [PostsWebController],
  providers: [PostsResolver, PostsService],
  exports: [PostsService],
})
export class PostsModule {}
