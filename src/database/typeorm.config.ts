import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Post } from '../posts/entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import { OpenGraphMetadata } from '../open-graph/entities/open-graph-metadata.entity';

export default new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User, Profile, Post, Category, OpenGraphMetadata],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
