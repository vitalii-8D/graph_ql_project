import { Resolver, Query, Mutation, Args, ID, Info } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';
import { PublishPostResult } from './dto/publish-post-result.type';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentsService } from './payments.service';

@Resolver(() => PaymentTransactionEntity)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

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
  myTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<PaymentTransactionEntity[]> {
    return this.paymentsService.myTransactions(user, getRequestedRelations(info, this.paymentsService.entityMetadata));
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [PaymentTransactionEntity], { name: 'transactionsForPost' })
  transactionsForPost(
    @Args('postId', { type: () => ID }) postId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<PaymentTransactionEntity[]> {
    return this.paymentsService.transactionsForPost(
      postId,
      user,
      getRequestedRelations(info, this.paymentsService.entityMetadata),
    );
  }
}
