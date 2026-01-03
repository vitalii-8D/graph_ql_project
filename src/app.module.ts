import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { UtilsModule } from './utils/utils.module';
import { CategoriesModule } from './categories/categories.module';
import { OpenGraphModule } from './open-graph/open-graph.module';
import { SeederModule } from './database/seeds/seeder.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { databaseConfig } from './database/database.config';
import { AppController } from './app.controller';

const autoSchemaFile = join(process.cwd(), 'src/database/schema.gql');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UtilsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile,
      sortSchema: true,
      playground: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
    PostsModule,
    CategoriesModule,
    OpenGraphModule,
    SeederModule,
    AuthModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
