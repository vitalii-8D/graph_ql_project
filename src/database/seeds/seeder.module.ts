import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeederService } from './seeder.service';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { Post } from '../../posts/entities/post.entity';
import { Category } from '../../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, Post, Category])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
