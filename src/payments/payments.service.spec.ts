import type { DataSource, Repository } from 'typeorm';
import type Stripe from 'stripe';

import { PaymentsService } from './payments.service';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentTransactionStatus } from './enums';
import { PostEntity } from '../posts/entities/post.entity';
import { PostStatus, PostPaymentStatus } from '../posts/enums';
import { type PostIndexService } from '../posts/services/post-index.service';
import { type StripeService } from './services/stripe.service';

function makeFailedEvent(paymentIntentId: string, message: string): Stripe.Event {
  return {
    type: 'payment_intent.payment_failed',
    data: { object: { id: paymentIntentId, status: 'canceled', last_payment_error: { message } } },
  } as unknown as Stripe.Event;
}

function makeCheckoutCompletedEvent(paymentIntentId: string): Stripe.Event {
  return {
    type: 'checkout.session.completed',
    data: { object: { payment_intent: paymentIntentId } },
  } as unknown as Stripe.Event;
}

describe('PaymentsService webhook state machine (REL-4)', () => {
  let service: PaymentsService;
  let transaction: PaymentTransactionEntity;
  let post: PostEntity;
  let manager: { update: jest.Mock };
  let stripeService: Partial<StripeService>;

  beforeEach(() => {
    transaction = {
      id: 1,
      userId: 10,
      postId: 1,
      stripeCheckoutSessionId: 'cs_1',
      stripePaymentIntentId: 'pi_1',
      status: PaymentTransactionStatus.PENDING,
    } as PaymentTransactionEntity;

    post = {
      id: 1,
      authorId: 10,
      status: PostStatus.DRAFT,
      hasBeenPublished: false,
      paymentStatus: PostPaymentStatus.PENDING,
    } as PostEntity;

    manager = {
      update: jest.fn((entityClass: unknown, _criteria: unknown, partial: Record<string, unknown>) => {
        if (entityClass === PaymentTransactionEntity) Object.assign(transaction, partial);
        if (entityClass === PostEntity) Object.assign(post, partial);
        return Promise.resolve();
      }),
    };

    const transactionsRepository = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(transaction)),
    } as unknown as Repository<PaymentTransactionEntity>;

    const postsRepository = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(post)),
    } as unknown as Repository<PostEntity>;

    stripeService = {
      retrievePaymentIntent: jest.fn(),
      findCheckoutSessionIdForPaymentIntent: jest.fn(),
    };

    const postIndexService = { reindexOne: jest.fn().mockResolvedValue(undefined) } as unknown as PostIndexService;

    const dataSource = {
      transaction: jest.fn((cb: (manager: unknown) => Promise<unknown>) => cb(manager)),
    } as unknown as DataSource;

    service = new PaymentsService(
      transactionsRepository,
      postsRepository,
      stripeService as StripeService,
      postIndexService,
      dataSource,
    );
  });

  it('marks the transaction FAILED on a declined attempt, then still succeeds on a later retry with the same PaymentIntent', async () => {
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValueOnce({
      status: 'canceled',
      last_payment_error: { message: 'Your card was declined.' },
    });

    await service.handleWebhookEvent(makeFailedEvent('pi_1', 'Your card was declined.'));

    expect(transaction.status).toBe(PaymentTransactionStatus.FAILED);
    expect(post.paymentStatus).toBe(PostPaymentStatus.FAILED);

    // Customer retries with a different card on the same Checkout Session/PaymentIntent.
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValueOnce({ status: 'succeeded' });

    await service.handleWebhookEvent(makeCheckoutCompletedEvent('pi_1'));

    // Before the REL-4 fix, this stayed FAILED forever because syncPaymentIntentStatus
    // returned early once the transaction's status was no longer PENDING.
    expect(transaction.status).toBe(PaymentTransactionStatus.SUCCEEDED);
    expect(post.status).toBe(PostStatus.PUBLISHED);
    expect(post.hasBeenPublished).toBe(true);
    expect(post.paymentStatus).toBe(PostPaymentStatus.SUCCEEDED);
  });

  it('is idempotent against a duplicate success event for an already-succeeded transaction', async () => {
    transaction.status = PaymentTransactionStatus.SUCCEEDED;
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue({ status: 'succeeded' });

    await service.handleWebhookEvent(makeCheckoutCompletedEvent('pi_1'));

    expect(manager.update).not.toHaveBeenCalled();
  });

  it('never regresses an already-succeeded transaction from a stale/out-of-order failure event', async () => {
    transaction.status = PaymentTransactionStatus.SUCCEEDED;
    post.status = PostStatus.PUBLISHED;
    post.paymentStatus = PostPaymentStatus.SUCCEEDED;
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue({
      status: 'canceled',
      last_payment_error: { message: 'stale failure' },
    });

    await service.handleWebhookEvent(makeFailedEvent('pi_1', 'stale failure'));

    expect(transaction.status).toBe(PaymentTransactionStatus.SUCCEEDED);
    expect(post.paymentStatus).toBe(PostPaymentStatus.SUCCEEDED);
  });
});
