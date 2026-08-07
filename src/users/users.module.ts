import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserIndexService } from './user-index.service';
import { UserEntity } from './entities/user.entity';
import { PostsModule } from '../posts/posts.module';
import { UserAvatarsModule } from '../user-avatars/user-avatars.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), forwardRef(() => PostsModule), UserAvatarsModule],
  providers: [UsersResolver, UsersService, UserIndexService],
  exports: [UsersService, UserIndexService],
})
export class UsersModule {}
