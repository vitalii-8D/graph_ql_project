import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Post } from '../posts/entities/post.entity';
import { Category } from '../categories/entities/category.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User, Profile, Post, Category],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: true,
};
