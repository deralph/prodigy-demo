import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  async handlePaystack(body: any, signature: string) {
    // Verify webhook signature
    const secret = this.config.get<string>('PAYSTACK_WEBHOOK_SECRET');
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
      if (hash !== signature) {
        this.logger.warn('Invalid Paystack webhook signature');
        return { status: 'invalid_signature' };
      }
    }

    const event = body.event;
    const data  = body.data;

    if (event === 'charge.success') {
      const reference    = data.reference as string;
      const amountKobo   = BigInt(data.amount);            // Paystack sends kobo
      const customerEmail = data.customer?.email as string;
      const clientDbId   = data.metadata?.clientDbId as string | undefined;

      this.logger.log(`charge.success: ref=${reference} amount=${amountKobo} email=${customerEmail}`);

      // Resolve clientDbId: prefer metadata, fall back to email lookup
      let resolvedClientId = clientDbId;
      if (!resolvedClientId) {
        const authUser = await this.prisma.authUser.findUnique({
          where: { email: customerEmail },
          select: { clientId: true },
        });
        resolvedClientId = authUser?.clientId ?? undefined;
      }

      if (!resolvedClientId) {
        this.logger.warn(`No client found for webhook: ref=${reference} email=${customerEmail}`);
        return { status: 'client_not_found' };
      }

      await this.walletService.creditWallet(
        resolvedClientId,
        amountKobo,
        reference,
        `Wallet Funding via Paystack (${data.channel || 'card'})`,
      );
      this.logger.log(`Wallet credited: clientId=${resolvedClientId} amount=₦${Number(amountKobo) / 100}`);

      // User-side + admin-side audit logs (non-blocking)
      const amountNaira = (Number(amountKobo) / 100).toLocaleString();
      const channel = data.channel || 'card';
      await this.prisma.activityLog.create({
        data: {
          clientId: resolvedClientId,
          action: 'WALLET_FUNDED',
          description: `₦${amountNaira} credited via Paystack webhook (${channel}) — ref: ${reference}`,
          amountKobo,
          metadata: { reference, channel, source: 'webhook' } as any,
        },
      }).catch(err => this.logger.warn(`ActivityLog write failed: ${err.message}`));

      await this.prisma.auditLog.create({
        data: {
          adminName: 'System · Paystack Webhook',
          adminRole: 'system',
          action: 'WALLET_FUNDED',
          targetEntity: resolvedClientId,
          category: 'FINANCE',
          metadata: { reference, channel, amountKobo: Number(amountKobo), source: 'webhook' } as any,
        },
      }).catch(err => this.logger.warn(`AuditLog write failed: ${err.message}`));
    }

    return { status: 'ok' };
  }
}
