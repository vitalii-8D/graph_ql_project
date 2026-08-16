import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';
import { PostEntity } from '../posts/entities/post.entity';
import { PostsService } from '../posts/services/posts.service';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/services/users.service';
import { PublishPostResult } from './dto/publish-post-result.type';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentsService } from './payments.service';

@Resolver(() => PaymentTransactionEntity)
export class PaymentsResolver {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PublishPostResult)
  publishPost(
    @Args('postId', { type: () => ID }) postId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PublishPostResult> {
    return this.paymentsService.publishPost(postId, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PublishPostResult)
  retryPostPayment(
    @Args('postId', { type: () => ID }) postId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PublishPostResult> {
    return this.paymentsService.retryPostPayment(postId, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PaymentTransactionEntity)
  refundPayment(
    @Args('transactionId', { type: () => ID }) transactionId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaymentTransactionEntity> {
    return this.paymentsService.refundPayment(transactionId, user);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [PaymentTransactionEntity], { name: 'myTransactions' })
  myTransactions(@CurrentUser() user: AuthenticatedUser): Promise<PaymentTransactionEntity[]> {
    return this.paymentsService.myTransactions(user);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [PaymentTransactionEntity], { name: 'transactionsForPost' })
  transactionsForPost(
    @Args('postId', { type: () => ID }) postId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaymentTransactionEntity[]> {
    return this.paymentsService.transactionsForPost(postId, user);
  }

  @ResolveField('post', () => PostEntity)
  async getPost(@Parent() transaction: PaymentTransactionEntity): Promise<PostEntity> {
    return this.postsService.findOne(transaction.postId);
  }

  @ResolveField('user', () => UserEntity)
  async getUser(@Parent() transaction: PaymentTransactionEntity): Promise<UserEntity | null> {
    return this.usersService.findByIdPlain(transaction.userId);
  }
}
