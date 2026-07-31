import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserEntity } from './entities/user.entity';
import { PostsModule } from '../posts/posts.module';
import { UserAvatarsModule } from '../user-avatars/user-avatars.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), forwardRef(() => PostsModule), UserAvatarsModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
