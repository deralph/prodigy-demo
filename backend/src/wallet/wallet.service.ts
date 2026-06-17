import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { lookupBankCodeByName } from './bank-codes';

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
   *
   * The frontend calls this AFTER the Paystack popup closes with success — there
   * is no separate "initiate" call before the popup, so cancelled popups never
   * create a PENDING record in the first place.
   *
   * If a PENDING record exists (optional pre-initiate), we upgrade it.
   * If not, we create + credit atomically.
   *
   * - With a secret key → verify against Paystack (with retries).
   * - TEST mode (sk_test / no key) → if verify can't confirm, credit as demo fallback.
   * - LIVE mode (sk_live) → strict, reject unverified.
   * Idempotent: re-calling with an already-SUCCESSFUL reference returns it.
   */
  async verifyPayment(clientDbId: string, reference: string, email?: string, amountKobo?: bigint) {
    this.logger.log(`[VERIFY] clientId=${clientDbId} ref=${reference} amountKobo=${amountKobo ?? 'none'}`);

    const existing = await this.prisma.walletTransaction.findFirst({
      where: { paystackRef: reference, clientId: clientDbId },
    });

    if (existing?.status === 'SUCCESSFUL') {
      this.logger.log(`[VERIFY] Already successful — idempotent return ref=${reference}`);
      return { status: 'success', transaction: existing };
    }

    const recordedAmount = existing?.amountKobo ?? amountKobo ?? BigInt(0);
    if (!existing && recordedAmount <= BigInt(0)) {
      throw new BadRequestException('A valid funding amount is required.');
    }
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const isTestMode = !secretKey || secretKey.startsWith('sk_test');

    if (secretKey) {
      const result = await this.queryPaystackVerify(reference, secretKey);
      const verified = !!result?.status && result?.data?.status === 'success';

      if (verified) {
        const verifiedAmountKobo = BigInt(result.data.amount);
        const channel = result.data.channel || 'card';
        const txn = await this.creditWallet(clientDbId, verifiedAmountKobo, reference, `Wallet Funding via Paystack (${channel})`);
        await this.logFundingEvent(clientDbId, verifiedAmountKobo, reference, 'SUCCESS', channel);
        return { status: 'success', transaction: txn };
      }

      const reason = result?.data?.gateway_response || result?.message || 'Verification failed';

      if (isTestMode) {
        this.logger.warn(
          `[VERIFY] Paystack verify unsuccessful in TEST mode (${reason}) — crediting as demo fallback. ref=${reference}`,
        );
        const txn = await this.creditWallet(clientDbId, recordedAmount, reference, 'Wallet Funding via Paystack (test)');
        await this.logFundingEvent(clientDbId, recordedAmount, reference, 'SUCCESS', 'test');
        return { status: 'success', transaction: txn };
      }

      // LIVE mode — reject unverified.
      this.logger.warn(`[VERIFY] Payment not successful: ${reason} ref=${reference}`);
      if (existing) {
        await this.prisma.walletTransaction.update({
          where: { id: existing.id },
          data: { status: 'FAILED', description: `Failed: ${reason}`, processedAt: new Date() },
        });
      }
      await this.logFundingEvent(clientDbId, recordedAmount, reference, 'FAILED', reason);
      throw new BadRequestException(`Payment verification failed: ${reason}`);
    }

    // No secret key — pure demo mode; trust the inline popup.
    this.logger.log(`[VERIFY] Demo mode (no secret key) — crediting wallet directly ref=${reference}`);
    const txn = await this.creditWallet(clientDbId, recordedAmount, reference, 'Wallet Funding via Paystack (demo)');
    await this.logFundingEvent(clientDbId, recordedAmount, reference, 'SUCCESS', 'demo');
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

  async requestWithdrawal(clientDbId: string, dto: { amountKobo: bigint; bankName: string; bankAcctNo: string; bankAcctName: string }, initiatedById?: string) {
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
      const txn = await tx.walletTransaction.create({
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
          initiatedById: initiatedById,
        },
      });

      // Create finance queue item for admin review/disbursement
      await tx.financeQueueItem.create({
        data: {
          fqRef: `FQ-WD-${Date.now()}`,
          type: 'WALLET_WITHDRAWAL',
          status: 'PENDING',
          clientId: clientDbId,
          amountKobo: dto.amountKobo,
          notes: JSON.stringify({ bankName: dto.bankName, bankAcctNo: dto.bankAcctNo, bankAcctName: dto.bankAcctName, walletTxnId: txn.id }),
          requestedById: initiatedById,
        },
      });

      return txn;
    });
  }

  /** Finance-triggered disbursement for a finance queue item. Handles Paystack recipient creation and transfer. */
  async disburseForFinanceItem(fqItemId: string, adminId?: string) {
    const item = await this.prisma.financeQueueItem.findUnique({ where: { id: fqItemId } });
    if (!item) throw new NotFoundException('Finance queue item not found');
    if (item.status !== 'APPROVED') throw new BadRequestException('Finance item is not approved');

    // Expect details in notes as JSON (created above)
    let details: any = {};
    try { details = JSON.parse(item.notes || '{}'); } catch {}

    const walletTxnId = details.walletTxnId;
    const walletTxn = walletTxnId ? await this.prisma.walletTransaction.findUnique({ where: { id: walletTxnId } }) : null;
    if (!walletTxn) throw new NotFoundException('Wallet transaction not found for finance item');

    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const isTestMode = !secretKey || secretKey.startsWith('sk_test');

    // Helper to mark success and record processedAt
    const markSuccess = async (txRef: string, transferResp?: any) => {
      await this.prisma.$transaction([
        this.prisma.walletTransaction.update({ where: { id: walletTxn.id }, data: { status: 'SUCCESSFUL', processedAt: new Date(), paystackRef: transferResp?.data?.reference ?? txRef } }),
        this.prisma.client.update({ where: { id: walletTxn.clientId }, data: { pendingBalance: { decrement: walletTxn.amountKobo } } }),
        this.prisma.financeQueueItem.update({ where: { id: fqItemId }, data: { status: 'DISBURSED', approvedById: adminId, approvedAt: new Date() } }),
      ]);
      // Logging: activity + audit
      try {
        await this.prisma.activityLog.create({
          data: {
            clientId: walletTxn.clientId,
            action: 'WALLET_WITHDRAWAL_DISBURSED',
            description: `₦${(Number(walletTxn.amountKobo) / 100).toLocaleString()} disbursed to ${walletTxn.bankAcctName} (${walletTxn.bankAcctNo}) — ref: ${txRef}`,
            amountKobo: walletTxn.amountKobo,
            metadata: { transferResp: transferResp?.data || transferResp, fqItemId } as any,
          },
        });
      } catch (err) {
        this.logger.warn(`ActivityLog write failed: ${(err as Error).message}`);
      }
      try {
        await this.prisma.auditLog.create({
          data: {
            adminName: 'Finance',
            adminRole: 'finance',
            action: 'WALLET_WITHDRAWAL_DISBURSED',
            targetEntity: walletTxn.clientId,
            category: 'FINANCE',
            metadata: { transferResp: transferResp?.data || transferResp, fqItemId, amountKobo: Number(walletTxn.amountKobo) } as any,
          },
        });
      } catch (err) {
        this.logger.warn(`AuditLog write failed: ${(err as Error).message}`);
      }
    };

    // Helper to rollback on failure
    const markFailedAndRefund = async (reason: string) => {
      await this.prisma.$transaction([
        this.prisma.walletTransaction.update({ where: { id: walletTxn.id }, data: { status: 'REVERSED', description: `Disbursement failed: ${reason}`, processedAt: new Date() } }),
        this.prisma.client.update({ where: { id: walletTxn.clientId }, data: { walletBalance: { increment: walletTxn.amountKobo }, pendingBalance: { decrement: walletTxn.amountKobo } } }),
        this.prisma.financeQueueItem.update({ where: { id: fqItemId }, data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason } }),
      ]);
      // Log refund and audit
      try {
        await this.prisma.activityLog.create({
          data: {
            clientId: walletTxn.clientId,
            action: 'WALLET_WITHDRAWAL_REFUNDED',
            description: `Withdrawal of ₦${(Number(walletTxn.amountKobo) / 100).toLocaleString()} refunded due to: ${reason}`,
            amountKobo: walletTxn.amountKobo,
            metadata: { reason, fqItemId } as any,
          },
        });
      } catch (err) {
        this.logger.warn(`ActivityLog write failed: ${(err as Error).message}`);
      }
      try {
        await this.prisma.auditLog.create({
          data: {
            adminName: 'Finance',
            adminRole: 'finance',
            action: 'WALLET_WITHDRAWAL_REFUNDED',
            targetEntity: walletTxn.clientId,
            category: 'FINANCE',
            metadata: { reason, fqItemId, amountKobo: Number(walletTxn.amountKobo) } as any,
          },
        });
      } catch (err) {
        this.logger.warn(`AuditLog write failed: ${(err as Error).message}`);
      }
      // Create org ledger refund entry
      try {
        await this.prisma.orgLedger.create({
          data: {
            entryRef: `ORG-WD-RF-${Date.now()}`,
            type: 'WALLET_WITHDRAWAL_REFUND',
            description: `Refund for failed withdrawal (fq: ${fqItemId})`,
            amountKobo: walletTxn.amountKobo,
            clientId: walletTxn.clientId,
            fqItemId,
            recordedById: adminId,
          },
        });
      } catch (err) {
        this.logger.warn(`OrgLedger write failed: ${(err as Error).message}`);
      }
    };

    if (isTestMode) {
      // Demo mode: mark successful without calling Paystack
      await markSuccess(`DEMO-${Date.now()}`, { data: { reference: `DEMO-${Date.now()}` } });
      return { status: 'disbursed', demo: true };
    }

    // Live mode: perform Paystack recipient creation + transfer
    try {
        // Resolve bank code from Paystack banks list; fallback to local mapping if not found
        let bankCode: string | undefined = details.bankCode;
        try {
          const banksResp = await fetch('https://api.paystack.co/bank?country=nigeria', { headers: { Authorization: `Bearer ${secretKey}` } });
          const banksBody = await banksResp.json();
          const bank = (banksBody?.data || []).find((b: any) => (details.bankName || '').toLowerCase().includes((b.name || '').toLowerCase()));
          bankCode = bank?.code || bankCode;
        } catch (err) {
          this.logger.warn(`Could not fetch Paystack bank list: ${(err as Error).message}`);
        }
        if (!bankCode) {
          bankCode = lookupBankCodeByName(details.bankName || walletTxn.bankName);
        }
        if (!bankCode) return await markFailedAndRefund('Unknown bank code');

      // Create transfer recipient
      const recipientResp = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'nuban', name: details.bankAcctName || walletTxn.bankAcctName, account_number: details.bankAcctNo || walletTxn.bankAcctNo, bank_code: bankCode, currency: 'NGN' }),
      });
      const recipientBody = await recipientResp.json();
      if (!recipientBody?.status) return await markFailedAndRefund(recipientBody?.message || 'Recipient creation failed');

      const recipientCode = recipientBody.data.recipient_code;
      // Initiate transfer
      const transferResp = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'balance', amount: Number(walletTxn.amountKobo), recipient: recipientCode, reason: 'Withdrawal to bank account' }),
      });
      const transferBody = await transferResp.json();
      if (!transferBody?.status) return await markFailedAndRefund(transferBody?.message || 'Transfer initiation failed');

      // Success — create org ledger + audit logs and mark transaction
      await markSuccess(transferBody.data.reference, transferBody);
      // Write org ledger entry for disbursement (outflow)
      try {
        await this.prisma.orgLedger.create({
          data: {
            entryRef: `ORG-WD-${Date.now()}`,
            type: 'WALLET_WITHDRAWAL_DISBURSED',
            description: `Withdrawal disbursed to ${walletTxn.bankAcctName} (${walletTxn.bankAcctNo}) via Paystack`,
            amountKobo: walletTxn.amountKobo,
            clientId: walletTxn.clientId,
            fqItemId: fqItemId,
            recordedById: adminId,
          },
        });
      } catch (err) {
        this.logger.warn(`OrgLedger write failed: ${(err as Error).message}`);
      }

      return { status: 'disbursed', reference: transferBody.data.reference };
    } catch (err: any) {
      await markFailedAndRefund(err?.message || 'Transfer error');
      throw err;
    }
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
