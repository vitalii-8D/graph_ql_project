import { DataSourceOptions } from 'typeorm';

import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { OpenGraphMetadata } from '../open-graph/entities/open-graph-metadata.entity';

export const databaseConfig: DataSourceOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [Category, User, Post, OpenGraphMetadata],
  synchronize: false,
  logging: true,
};
