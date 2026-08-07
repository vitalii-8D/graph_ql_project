import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { CommentIndexService } from './comment-index.service';
import { CommentEntity } from './entities/comment.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, PostEntity]), PostsModule, UsersModule],
  providers: [CommentsResolver, CommentsService, CommentIndexService],
  exports: [CommentsService, CommentIndexService],
})
export class CommentsModule {}
