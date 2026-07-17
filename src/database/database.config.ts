import { type DataSourceOptions } from 'typeorm';

import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { OpenGraphMetadataEntity } from '../open-graph/entities/open-graph-metadata.entity';

export const databaseConfig: DataSourceOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [CategoryEntity, UserEntity, PostEntity, OpenGraphMetadataEntity],
  synchronize: false,
  logging: false,
};
