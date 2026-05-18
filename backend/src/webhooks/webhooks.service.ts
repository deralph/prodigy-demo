import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handlePaystack(body: any, signature: string) {
    // Verify webhook signature
    const secret = this.config.get('PAYSTACK_WEBHOOK_SECRET');
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
      if (hash !== signature) {
        this.logger.warn('Invalid Paystack webhook signature');
        return { status: 'invalid_signature' };
      }
    }

    const event = body.event;
    const data = body.data;

    if (event === 'charge.success') {
      // Credit wallet on successful payment
      const reference = data.reference;
      const amount = data.amount / 100; // Paystack sends amount in kobo

      this.logger.log(`Payment success: ${reference} — ₦${amount}`);

      // Find wallet by metadata or reference and credit
      // Implementation depends on how payment was initiated
    }

    return { status: 'ok' };
  }
}
