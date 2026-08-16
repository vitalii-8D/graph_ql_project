import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type Stripe from 'stripe';

import type { AuthenticatedUser } from '../auth/types/common';
import { config } from '../constants/config';
import { OrderDirection } from '../enums/order-direction.enum';
import { PostEntity } from '../posts/entities/post.entity';
import { PostStatus, PostPaymentStatus } from '../posts/enums';
import { PostIndexService } from '../posts/services/post-index.service';
import { UserRole } from '../users/enums';
import { POST_PUBLISH_PRICE_CENTS, POST_PUBLISH_CURRENCY } from './constants';
import { PublishPostResult } from './dto/publish-post-result.type';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentTransactionStatus } from './enums';
import { StripeService } from './services/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentTransactionEntity)
    private transactionsRepository: Repository<PaymentTransactionEntity>,
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    private readonly stripeService: StripeService,
    private readonly postIndexService: PostIndexService,
  ) {}

  async publishPost(postId: number, user: AuthenticatedUser): Promise<PublishPostResult> {
    const post = await this.findOwnedPost(postId, user);

    if (post.hasBeenPublished) {
      post.status = PostStatus.PUBLISHED;
      const savedPost = await this.postsRepository.save(post);
      await this.postIndexService.reindexOne(savedPost.id);

      return { post: savedPost, checkoutUrl: null, checkoutSessionId: null };
    }

    const { checkoutUrl, checkoutSessionId } = await this.createPaymentAttempt(post, user);
    return { post: null, checkoutUrl, checkoutSessionId };
  }

  async retryPostPayment(postId: number, user: AuthenticatedUser): Promise<PublishPostResult> {
    const post = await this.findOwnedPost(postId, user);

    if (post.hasBeenPublished) {
      throw new BadRequestException('This post has already been published — no payment needed.');
    }

    const { checkoutUrl, checkoutSessionId } = await this.createPaymentAttempt(post, user);
    return { post: null, checkoutUrl, checkoutSessionId };
  }

  private async findOwnedPost(postId: number, user: AuthenticatedUser): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only publish your own posts');
    }
    return post;
  }

  private async createPaymentAttempt(
    post: PostEntity,
    user: AuthenticatedUser,
  ): Promise<{ checkoutUrl: string; checkoutSessionId: string }> {
    // Note: `success_url`/`cancel_url` can only carry a plain `postId` — the FE doesn't resolve
    // or check payment status itself, it just shows whatever the webhook has already written by
    // the time the success page loads (see `.local/payments/payment-flow.md`).
    const session = await this.stripeService.createCheckoutSession({
      postId: post.id,
      postTitle: post.title,
      amount: POST_PUBLISH_PRICE_CENTS,
      currency: POST_PUBLISH_CURRENCY,
      successUrl: `${config.app.webUrl}/payments/success?postId=${post.id}`,
      cancelUrl: `${config.app.webUrl}/payments/cancel?postId=${post.id}`,
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL for this session');
    }

    // Stripe doesn't create the PaymentIntent until the customer completes the checkout page, so
    // `session.payment_intent` is null here — the transaction is keyed on the checkout session id
    // for now, and `stripePaymentIntentId` gets backfilled once the webhook tells us it exists.
    const transaction = this.transactionsRepository.create({
      userId: user.id,
      postId: post.id,
      stripeCheckoutSessionId: session.id,
      amount: POST_PUBLISH_PRICE_CENTS,
      currency: POST_PUBLISH_CURRENCY,
      status: PaymentTransactionStatus.PENDING,
    });
    await this.transactionsRepository.save(transaction);

    post.paymentStatus = PostPaymentStatus.PENDING;
    await this.postsRepository.save(post);

    return { checkoutUrl: session.url, checkoutSessionId: session.id };
  }

  private async syncPaymentIntentStatus(paymentIntentId: string): Promise<void> {
    const transaction = await this.findTransactionByPaymentIntentId(paymentIntentId);

    if (transaction.status !== PaymentTransactionStatus.PENDING) {
      return;
    }

    const paymentIntent = await this.stripeService.retrievePaymentIntent(paymentIntentId);
    await this.applyPaymentIntentStatus(transaction, paymentIntent);
  }

  // The transaction row is only keyed on `stripePaymentIntentId` once the webhook has actually
  // told us it exists — `payment_intent.payment_failed` doesn't carry a checkout session
  // reference, so this is the first time we hear about that id. Fall back to Stripe's Checkout
  // Session ↔ PaymentIntent link (there's no reverse field on PaymentIntent itself) and backfill
  // the column.
  private async findTransactionByPaymentIntentId(paymentIntentId: string): Promise<PaymentTransactionEntity> {
    let transaction = await this.transactionsRepository.findOne({ where: { stripePaymentIntentId: paymentIntentId } });

    if (!transaction) {
      const checkoutSessionId = await this.stripeService.findCheckoutSessionIdForPaymentIntent(paymentIntentId);
      if (checkoutSessionId) {
        transaction = await this.transactionsRepository.findOne({
          where: { stripeCheckoutSessionId: checkoutSessionId },
        });
        if (transaction && !transaction.stripePaymentIntentId) {
          transaction.stripePaymentIntentId = paymentIntentId;
          await this.transactionsRepository.save(transaction);
        }
      }
    }

    if (!transaction) {
      throw new NotFoundException(`No payment transaction found for payment intent ${paymentIntentId}`);
    }
    return transaction;
  }

  private async applyPaymentIntentStatus(
    transaction: PaymentTransactionEntity,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    if (paymentIntent.status === 'succeeded') {
      transaction.status = PaymentTransactionStatus.SUCCEEDED;
      await this.transactionsRepository.save(transaction);

      const post = await this.postsRepository.findOne({ where: { id: transaction.postId } });
      if (post) {
        post.status = PostStatus.PUBLISHED;
        post.hasBeenPublished = true;
        post.paymentStatus = PostPaymentStatus.SUCCEEDED;
        await this.postsRepository.save(post);
        await this.postIndexService.reindexOne(post.id);
      }
    } else if (paymentIntent.status === 'canceled' || paymentIntent.last_payment_error) {
      transaction.status = PaymentTransactionStatus.FAILED;
      transaction.failureReason = paymentIntent.last_payment_error?.message ?? 'Payment failed';
      await this.transactionsRepository.save(transaction);

      await this.postsRepository.update({ id: transaction.postId }, { paymentStatus: PostPaymentStatus.FAILED });
    }
  }

  // The single source of truth for payment confirmation — the FE never polls or checks payment
  // status itself, it only ever displays whatever this handler has already written.
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // `checkout.session.completed` is Stripe's recommended event for Checkout fulfillment —
      // fires once the customer has paid, guaranteeing `session.payment_intent` is populated.
      // Declined cards keep the customer on the same hosted page to retry, so
      // `payment_intent.payment_failed` is the only reliable signal for recording a failed
      // attempt with its decline reason.
      case 'checkout.session.completed':
      case 'payment_intent.payment_failed': {
        const paymentIntentId = this.extractPaymentIntentId(event);
        if (paymentIntentId) {
          await this.syncPaymentIntentStatus(paymentIntentId);
        }
        break;
      }
      default:
        break;
    }
  }

  private extractPaymentIntentId(event: Stripe.Event): string | null {
    if (event.type.startsWith('checkout.session')) {
      const session = event.data.object as Stripe.Checkout.Session;
      const pi = session.payment_intent;

      return typeof pi === 'string' ? pi : (pi?.id ?? null);
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    return paymentIntent.id ?? null;
  }

  async myTransactions(user: AuthenticatedUser): Promise<PaymentTransactionEntity[]> {
    return this.transactionsRepository.find({
      where: { userId: user.id },
      order: { createdAt: OrderDirection.DESC },
    });
  }

  async transactionsForPost(postId: number, user: AuthenticatedUser): Promise<PaymentTransactionEntity[]> {
    await this.findOwnedPost(postId, user);
    return this.transactionsRepository.find({
      where: { postId },
      order: { createdAt: OrderDirection.DESC },
    });
  }

  async refundPayment(transactionId: number, user: AuthenticatedUser): Promise<PaymentTransactionEntity> {
    const transaction = await this.transactionsRepository.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    if (user.role !== UserRole.ADMIN && transaction.userId !== user.id) {
      throw new ForbiddenException('You can only refund your own transactions');
    }
    if (transaction.status !== PaymentTransactionStatus.SUCCEEDED) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    // A SUCCEEDED transaction always has its PaymentIntent id resolved by `applyPaymentIntentStatus`.
    const refund = await this.stripeService.createRefund(transaction.stripePaymentIntentId!);

    transaction.status = PaymentTransactionStatus.REFUNDED;
    transaction.stripeRefundId = refund.id;
    transaction.refundedAt = new Date();
    await this.transactionsRepository.save(transaction);

    const post = await this.postsRepository.findOne({ where: { id: transaction.postId } });
    if (post) {
      post.status = PostStatus.DRAFT;
      post.hasBeenPublished = false;
      post.paymentStatus = PostPaymentStatus.REFUNDED;
      await this.postsRepository.save(post);
      await this.postIndexService.reindexOne(post.id);
    }

    return transaction;
  }
}
