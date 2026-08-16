import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import { config } from '../../constants/config';

export interface CreateCheckoutSessionParams {
  postId: number;
  postTitle: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * The single wrapper around the Stripe Node SDK — every other file in the app goes through
 * this service rather than importing `stripe` directly, so there is one place that knows how
 * to talk to the Stripe API.
 */
@Injectable()
export class StripeService {
  private readonly client: Stripe;

  constructor() {
    this.client = new Stripe(config.stripe.secretKey);
  }

  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    return this.client.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency,
            unit_amount: params.amount,
            product_data: { name: `Publish: ${params.postTitle}` },
          },
          quantity: 1,
        },
      ],
      metadata: { postId: String(params.postId) },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.client.paymentIntents.retrieve(paymentIntentId);
  }

  // PaymentIntent events don't carry their originating Checkout Session id, so this is the only
  // way to walk backwards from a payment intent id to the session id we actually keyed our
  // transaction row on.
  async findCheckoutSessionIdForPaymentIntent(paymentIntentId: string): Promise<string | null> {
    const sessions = await this.client.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
    return sessions.data[0]?.id ?? null;
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.client.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  }

  createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
    return this.client.refunds.create({ payment_intent: paymentIntentId });
  }
}
