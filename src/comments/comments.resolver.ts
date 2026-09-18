import { Resolver, Query, Mutation, Args, ID, Info, Int, registerEnumType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { CommentsService } from './comments.service';
import { CommentsAnalyticsService } from './comments-analytics.service';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import {
  CommentsPerPostStat,
  CommentsPerUserStat,
  CommentsPerPeriodStat,
  RatingDistributionStat,
} from './dto/comment-analytics.types';
import { CommentPeriodGranularity } from './enums';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums';
import type { AuthenticatedUser } from '../auth/types/common';

registerEnumType(CommentPeriodGranularity, {
  name: 'CommentPeriodGranularity',
  description: 'Time bucket granularity for comment analytics',
});

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsAnalyticsService: CommentsAnalyticsService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CommentEntity)
  createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<CommentEntity> {
    return this.commentsService.create(
      createCommentInput,
      user,
      getRequestedRelations(info, this.commentsService.entityMetadata),
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CommentEntity)
  updateComment(
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<CommentEntity> {
    return this.commentsService.update(
      updateCommentInput,
      user,
      getRequestedRelations(info, this.commentsService.entityMetadata),
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CommentEntity)
  removeComment(
    @Args('id', { type: () => ID }) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommentEntity> {
    return this.commentsService.remove(id, user);
  }

  @Query(() => [CommentEntity], { name: 'commentsByPost' })
  commentsByPost(
    @Args('postId', { type: () => ID }) postId: number,
    @Info() info: GraphQLResolveInfo,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<CommentEntity[]> {
    return this.commentsService.findByPost(
      postId,
      getRequestedRelations(info, this.commentsService.entityMetadata),
      limit,
      offset,
    );
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [CommentsPerPostStat], { name: 'commentsPerPost' })
  commentsPerPost(): Promise<CommentsPerPostStat[]> {
    return this.commentsAnalyticsService.commentsPerPost();
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [CommentsPerUserStat], { name: 'commentsPerUser' })
  commentsPerUser(): Promise<CommentsPerUserStat[]> {
    return this.commentsAnalyticsService.commentsPerUser();
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [CommentsPerPeriodStat], { name: 'commentsPerPeriod' })
  commentsPerPeriod(
    @Args('granularity', { type: () => CommentPeriodGranularity }) granularity: CommentPeriodGranularity,
  ): Promise<CommentsPerPeriodStat[]> {
    return this.commentsAnalyticsService.commentsPerPeriod(granularity);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [RatingDistributionStat], { name: 'commentRatingDistribution' })
  commentRatingDistribution(): Promise<RatingDistributionStat[]> {
    return this.commentsAnalyticsService.ratingDistribution();
  }
}
