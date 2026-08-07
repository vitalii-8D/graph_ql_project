import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDashboardInput } from './dto/analytics-dashboard.input';
import { AnalyticsDashboard } from './dto/analytics-dashboard.types';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => AnalyticsDashboard, { name: 'analyticsDashboard' })
  analyticsDashboard(@Args('input', { nullable: true }) input?: AnalyticsDashboardInput): Promise<AnalyticsDashboard> {
    return this.analyticsService.getDashboard(input ?? {});
  }
}
