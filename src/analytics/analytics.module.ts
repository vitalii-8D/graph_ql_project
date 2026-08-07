import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [UsersModule, PostsModule],
  providers: [AnalyticsResolver, AnalyticsService],
})
export class AnalyticsModule {}
