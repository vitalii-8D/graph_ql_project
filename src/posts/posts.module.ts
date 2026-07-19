import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PostsWebController } from './posts-web.controller';
import { PostEntity } from './entities/post.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { OpenGraphModule } from '../open-graph/open-graph.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, CategoryEntity, UserEntity]),
    forwardRef(() => UsersModule),
    OpenGraphModule,
  ],
  controllers: [PostsWebController],
  providers: [PostsResolver, PostsService],
  exports: [PostsService],
})
export class PostsModule {}
