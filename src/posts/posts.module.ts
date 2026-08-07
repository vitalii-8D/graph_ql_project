import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PostIndexService } from './post-index.service';
import { PostEntity } from './entities/post.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { OpenGraphModule } from '../open-graph/open-graph.module';
import { PostImagesModule } from '../post-images/post-images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, CategoryEntity, UserEntity]),
    forwardRef(() => UsersModule),
    OpenGraphModule,
    PostImagesModule,
  ],
  providers: [PostsResolver, PostsService, PostIndexService],
  exports: [PostsService, PostIndexService],
})
export class PostsModule {}
