import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PostEntity])],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
