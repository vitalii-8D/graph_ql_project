import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, registerEnumType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { CommentsService } from './comments.service';
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
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/services/users.service';
import { PostEntity } from '../posts/entities/post.entity';
import { PostsService } from '../posts/services/posts.service';
import type { AuthenticatedUser } from '../auth/types/common';

registerEnumType(CommentPeriodGranularity, {
  name: 'CommentPeriodGranularity',
  description: 'Time bucket granularity for comment analytics',
});

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CommentEntity)
  createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommentEntity> {
    return this.commentsService.create(createCommentInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CommentEntity)
  updateComment(
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CommentEntity> {
    return this.commentsService.update(updateCommentInput, user);
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
  commentsByPost(@Args('postId', { type: () => ID }) postId: number): Promise<CommentEntity[]> {
    return this.commentsService.findByPost(postId);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [CommentsPerPostStat], { name: 'commentsPerPost' })
  commentsPerPost(): Promise<CommentsPerPostStat[]> {
    return this.commentsService.commentsPerPost();
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [CommentsPerUserStat], { name: 'commentsPerUser' })
  commentsPerUser(): Promise<CommentsPerUserStat[]> {
    return this.commentsService.commentsPerUser();
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [CommentsPerPeriodStat], { name: 'commentsPerPeriod' })
  commentsPerPeriod(
    @Args('granularity', { type: () => CommentPeriodGranularity }) granularity: CommentPeriodGranularity,
  ): Promise<CommentsPerPeriodStat[]> {
    return this.commentsService.commentsPerPeriod(granularity);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [RatingDistributionStat], { name: 'commentRatingDistribution' })
  commentRatingDistribution(): Promise<RatingDistributionStat[]> {
    return this.commentsService.ratingDistribution();
  }

  @ResolveField('post', () => PostEntity)
  async getPost(@Parent() comment: CommentEntity): Promise<PostEntity> {
    return this.postsService.findOne(comment.postId);
  }

  @ResolveField('author', () => UserEntity)
  async getAuthor(@Parent() comment: CommentEntity): Promise<UserEntity | null> {
    return this.usersService.findByIdPlain(comment.authorId);
  }
}
