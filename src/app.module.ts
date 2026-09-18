import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { UtilsModule } from './utils/utils.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { OpenGraphModule } from './open-graph/open-graph.module';
import { SeederModule } from './database/seeds/seeder.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { ChatModule } from './chat/chat.module';
import { StorageModule } from './storage/storage.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { ReindexModule } from './elasticsearch/reindex.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { databaseConfig } from './database/database.config';
import { AppController } from './app.controller';
import { GraphqlLoggingPlugin } from './utils/graphql-logging.plugin';
import { createGraphqlSubscriptionsConfig } from './graphql-subscriptions.config';

const autoSchemaFile = join(process.cwd(), 'src/database/schema.gql');

@Module({
  imports: [
    UtilsModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [AuthService],
      useFactory: (authService: AuthService): ApolloDriverConfig => ({
        autoSchemaFile,
        sortSchema: true,
        playground: true,
        ...createGraphqlSubscriptionsConfig(authService),
      }),
    }),
    TypeOrmModule.forRoot(databaseConfig),
    ElasticsearchModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    CommentsModule,
    OpenGraphModule,
    SeederModule,
    AuthModule,
    ChatModule,
    StorageModule,
    ReindexModule,
    AnalyticsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [GraphqlLoggingPlugin],
})
export class AppModule {}
