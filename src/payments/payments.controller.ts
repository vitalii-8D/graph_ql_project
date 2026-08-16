import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';

import { PaymentsService } from './payments.service';
import { StripeService } from './services/stripe.service';

@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  // No auth guard here — Stripe calls this directly, the signature check below is the auth.
  @Post('stripe/webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body for Stripe signature verification');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    } catch (error) {
      // A bad/missing signature is a client error (400), not a server error (500) — Stripe
      // treats 5xx responses as "retry later," which would just repeat the same rejection.
      throw new BadRequestException(`Webhook signature verification failed: ${(error as Error).message}`);
    }

    await this.paymentsService.handleWebhookEvent(event);

    return { received: true };
  }
}
