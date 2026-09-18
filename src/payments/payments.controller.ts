import { BadRequestException, Controller, Headers, Logger, NotFoundException, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';

import { PaymentsService } from './payments.service';
import { StripeService } from './services/stripe.service';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

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

    try {
      await this.paymentsService.handleWebhookEvent(event);
    } catch (error) {
      // A transaction row that will never exist (deleted, stray test event, ...) is terminal —
      // returning a non-2xx here would just make Stripe retry the same unresolvable event for
      // days. Log it for manual review and acknowledge receipt; any other error still propagates
      // so Stripe retries genuinely transient failures.
      if (error instanceof NotFoundException) {
        this.logger.error(`Unrecoverable webhook event ${event.id} (${event.type}): ${error.message}`);
      } else {
        throw error;
      }
    }

    return { received: true };
  }
}
