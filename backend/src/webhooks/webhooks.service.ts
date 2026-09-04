import {
  Injectable,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
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

  /**
   * Handle a Paystack webhook with strict security checks:
   *  1. The webhook secret MUST be configured — we never silently accept a
   *     webhook (or process it) when it is missing, in any environment.
   *  2. The HMAC-SHA512 signature is verified against the ORIGINAL raw body
   *     bytes (constant-time comparison). Invalid signatures → HTTP 401.
   *  3. charge.success events cross-check reference, expected transaction,
   *     amount, currency and transaction status before crediting.
   *  4. Crediting remains idempotent (handled by WalletService.creditWallet).
   */
  async handlePaystack(rawBody: Buffer, signature?: string) {
    const secret = this.config.get<string>('PAYSTACK_WEBHOOK_SECRET');
    if (!secret) {
      // Fail closed: without the shared secret there is no way to prove the
      // request came from Paystack, so we refuse it outright.
      this.logger.error('Paystack webhook rejected: PAYSTACK_WEBHOOK_SECRET is not configured.');
      throw new ServiceUnavailableException('Paystack webhook secret is not configured.');
    }

    if (!signature) {
      this.logger.warn('Paystack webhook rejected: missing signature header');
      throw new UnauthorizedException('Missing Paystack webhook signature');
    }

    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (!this.secureCompare(expected, signature)) {
      this.logger.warn('Paystack webhook rejected: invalid signature');
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    let body: any;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      this.logger.warn('Paystack webhook rejected: unparseable body');
      throw new BadRequestException('Invalid webhook payload');
    }

    const event = body?.event;
    const data  = body?.data;

    if (event === 'charge.success') {
      return this.handleChargeSuccess(data);
    }

    // Other Paystack events are acknowledged but not acted upon.
    return { status: 'ignored' };
  }

  private async handleChargeSuccess(data: any) {
    const reference    = data?.reference as string | undefined;
    const rawAmount    = data?.amount;
    const currency     = String(data?.currency ?? 'NGN').toUpperCase();
    const status       = data?.status;
    const customerEmail = data?.customer?.email as string | undefined;
    const clientDbId   = data?.metadata?.clientDbId as string | undefined;

    if (!reference) {
      this.logger.warn('charge.success without reference — ignored');
      return { status: 'ignored' };
    }

    if (rawAmount == null || !Number.isInteger(Number(rawAmount))) {
      this.logger.warn(`charge.success with invalid amount ref=${reference} — rejected`);
      return { status: 'invalid_amount' };
    }
    const amountKobo = BigInt(rawAmount);
    if (amountKobo <= BigInt(0)) {
      this.logger.warn(`charge.success with non-positive amount ref=${reference} — rejected`);
      return { status: 'invalid_amount' };
    }

    // Cross-check transaction status (charge.success must report success).
    if (status !== 'success') {
      this.logger.warn(`charge.success with status="${status}" ref=${reference} — rejected`);
      return { status: 'not_successful' };
    }

    // Cross-check currency — this platform operates in NGN only.
    if (currency !== 'NGN') {
      this.logger.warn(`charge.success with currency="${currency}" ref=${reference} — rejected`);
      return { status: 'unsupported_currency' };
    }

    // Resolve the owning client: prefer metadata.clientDbId, fall back to a
    // customer-email lookup (never trust an arbitrary ID from the payload).
    let resolvedClientId = clientDbId;
    if (!resolvedClientId && customerEmail) {
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

    // Cross-check against the expected transaction (if one was recorded):
    //   * Already SUCCESSFUL  → idempotent duplicate, no double credit.
    //   * FAILED / REVERSED   → never re-credit.
    //   * Amount mismatch     → reject (prevents arbitrary/incorrect credit).
    // If no transaction exists yet (the popup flow does not pre-create one),
    // the mandatory signature verification above is the guarantee the amount
    // is genuine Paystack data.
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { paystackRef: reference },
    });

    if (existing && existing.status === 'SUCCESSFUL') {
      this.logger.log(`Webhook duplicate charge.success ref=${reference} — already credited, idempotent`);
      return { status: 'ok' };
    }
    if (existing && (existing.status === 'FAILED' || existing.status === 'REVERSED')) {
      this.logger.warn(`Webhook rejected: reference ${reference} was previously ${existing.status}`);
      return { status: 'already_settled' };
    }
    if (existing && existing.amountKobo !== amountKobo) {
      this.logger.warn(
        `Webhook amount mismatch ref=${reference}: webhook=${amountKobo} expected=${existing.amountKobo} — rejected`,
      );
      return { status: 'amount_mismatch' };
    }

    this.logger.log(`charge.success: ref=${reference} amount=${amountKobo} email=${customerEmail}`);

    // Credit the wallet — idempotency is enforced atomically inside
    // creditWallet, so a genuine duplicate cannot double-credit.
    await this.walletService.creditWallet(
      resolvedClientId,
      amountKobo,
      reference,
      `Wallet Funding via Paystack (${data?.channel || 'card'})`,
    );
    this.logger.log(`Wallet credited: clientId=${resolvedClientId} amount=₦${Number(amountKobo) / 100}`);

    // User-side + admin-side audit logs (non-blocking)
    const amountNaira = (Number(amountKobo) / 100).toLocaleString();
    const channel = data?.channel || 'card';
    await this.prisma.activityLog.create({
      data: {
        clientId: resolvedClientId,
        action: 'WALLET_FUNDED',
        description: `₦${amountNaira} credited via Paystack webhook (${channel}) — ref: ${reference}`,
        amountKobo,
        metadata: { reference, channel, source: 'webhook' } as any,
      },
    }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

    await this.prisma.auditLog.create({
      data: {
        adminName: 'System · Paystack Webhook',
        adminRole: 'system',
        action: 'WALLET_FUNDED',
        targetEntity: resolvedClientId,
        category: 'FINANCE',
        metadata: { reference, channel, amountKobo: Number(amountKobo), source: 'webhook' } as any,
      },
    }).catch((err) => this.logger.warn(`AuditLog write failed: ${err.message}`));

    return { status: 'ok' };
  }

  /** Constant-time hex comparison to avoid leaking timing information. */
  private secureCompare(expectedHex: string, actualHex: string): boolean {
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(String(actualHex ?? ''), 'hex');
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  }
}