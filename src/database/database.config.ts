import { config as loadEnv } from 'dotenv';
import { type DataSourceOptions } from 'typeorm';

import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { OpenGraphMetadataEntity } from '../open-graph/entities/open-graph-metadata.entity';

loadEnv();

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'pdp_local',
  entities: [CategoryEntity, UserEntity, PostEntity, OpenGraphMetadataEntity],
  synchronize: false,
  logging: false,
};
