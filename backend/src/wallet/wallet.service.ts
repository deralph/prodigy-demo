import { Injectable, NotFoundException, BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeBankName, lookupBankCodeFallback } from './bank-codes';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  async getWallet(clientDbId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientDbId },
      select: { walletBalance: true, pendingBalance: true, virtualAccountNo: true, virtualAccountBank: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async getTransactions(
    clientDbId: string,
    query?: {
      type?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(200, Math.max(1, query?.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: any = {
      clientId: clientDbId,
      ...(query?.type && { type: query.type as any }),
      ...(query?.status && { status: query.status as any }),
    };

    if (query?.dateFrom || query?.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        const from = new Date(query.dateFrom);
        if (isNaN(from.getTime())) throw new BadRequestException('Invalid dateFrom');
        where.createdAt.gte = from;
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        if (isNaN(to.getTime())) throw new BadRequestException('Invalid dateTo');
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          investment: { select: { id: true, investRef: true, product: { select: { name: true } } } },
          relatedTransaction: { select: { id: true, txnRef: true, type: true, status: true } },
        },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTransactionDetail(clientDbId: string, transactionId: string) {
    const where: any = { id: transactionId };
    if (clientDbId) where.clientId = clientDbId;

    const txn = await this.prisma.walletTransaction.findFirst({
      where,
      include: {
        client: { select: { id: true, clientRef: true, name: true, email: true } },
        investment: { include: { product: true } },
        relatedTransaction: true,
      },
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    const activityLog = await this.prisma.activityLog.findMany({
      where: { clientId: txn.clientId, metadata: { path: ['txnRef'], equals: txn.txnRef } },
      orderBy: { occurredAt: 'desc' },
      take: 20,
    });

    const auditLog = await this.prisma.auditLog.findMany({
      where: { targetEntity: transactionId },
      orderBy: { occurredAt: 'desc' },
      take: 20,
    });

    return { transaction: txn, activityLog, auditLog };
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
    const isLiveEnv = process.env.NODE_ENV === 'production';

    // Fail closed in production: without a live Paystack secret key the verify
    // endpoint can never confirm a real charge, so the "demo fallback" paths
    // below would credit wallet balance without payment. We refuse instead.
    if (isLiveEnv && isTestMode) {
      throw new ServiceUnavailableException(
        'Payment verification is unavailable: a live Paystack secret key is not configured in this environment.',
      );
    }

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
    let isNewCredit = true;
    const result = await this.prisma.$transaction(async (tx) => {
      // Idempotency guard
      const already = await tx.walletTransaction.findFirst({
        where: { paystackRef, status: 'SUCCESSFUL' },
      });
      if (already) { isNewCredit = false; return already; }

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
          data: { status: 'SUCCESSFUL', amountKobo, approvedAmountKobo: amountKobo, disbursedAmountKobo: amountKobo, description, processedAt: new Date(), approvedAt: new Date() },
        });
      }

      // Deterministic reference — the unique index on txnRef makes the create
      // atomic under concurrency. If the webhook and the client verify request
      // race for the same Paystack reference, one wins the INSERT and the other
      // hits P2002 and (below, outside this transaction) resolves to the
      // committed record. The loser's whole transaction — including the wallet
      // increment — is rolled back, so the wallet is credited exactly once.
      return tx.walletTransaction.create({
        data: {
          txnRef: `WAL-FT-${paystackRef}`,
          clientId: clientDbId,
          type: 'WALLET_FUNDING',
          status: 'SUCCESSFUL',
          amountKobo,
          approvedAmountKobo: amountKobo,
          disbursedAmountKobo: amountKobo,
          description,
          paystackRef,
          processedAt: new Date(),
          approvedAt: new Date(),
        },
      });
    }).catch(async (err: any) => {
      if (err?.code === 'P2002') {
        // Lost the race — a concurrent caller already created this funding txn.
        const existing = await this.prisma.walletTransaction.findFirst({
          where: { paystackRef, status: 'SUCCESSFUL' },
        });
        if (existing) {
          isNewCredit = false;
          return existing;
        }
      }
      throw err;
    });

    if (isNewCredit) {
      const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
      if (client) {
        this.notifications.sendWalletFundedEmail(client.email, client.name, Number(amountKobo) / 100).catch(() => {});
      }
    }

    return result;
  }

  async requestWithdrawal(
    clientDbId: string,
    requesterAuthUserId: string,
    dto: { amountKobo: bigint; bankName: string; bankAcctNo: string; bankAcctName: string },
  ) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');

    // ── Basic input validation ──────────────────────────────────────────
    // Without this guard a zero/negative amount would pass the balance check
    // below (anything < a positive balance) and decrement/increment the
    // ledger by a negative number — effectively minting wallet balance.
    const amountKobo = BigInt(dto.amountKobo ?? 0);
    if (amountKobo <= BigInt(0)) {
      throw new BadRequestException('Withdrawal amount must be greater than zero.');
    }
    if (!dto.bankName?.trim() || !dto.bankAcctNo?.trim() || !dto.bankAcctName?.trim()) {
      throw new BadRequestException('Destination bank name, account number, and account name are required.');
    }
    if (client.walletBalance < amountKobo) throw new BadRequestException('Insufficient wallet balance');

    // ── Mandate enforcement ──────────────────────────────────────────────
    // Single-signatory accounts (INDIVIDUAL, CORPORATE) have no co-signatory
    // to enforce against, so the requester's own authorization is sufficient.
    // JOINT accounts must strictly honour the mandate set at account
    // creation:
    //   - OR  → any one holder may authorise the withdrawal independently —
    //           it goes straight to the admin disbursement queue.
    //   - AND → any holder may *initiate* the request, but it cannot be
    //           approved/disbursed until the OTHER holder separately logs
    //           into their own account and co-signs it (see
    //           cosignWithdrawal below). This is real second-signature
    //           enforcement now that each joint holder has their own
    //           login — not a checkbox one party can tick on the other's
    //           behalf.
    const mandate = client.mandateType ?? 'AND';
    const isAndMandate = client.type === 'JOINT' && mandate === 'AND';

    if (isAndMandate) {
      // Guard against creating a co-sign request nobody can ever fulfil:
      // if the secondary holder hasn't set up their own login yet, there
      // is no second account to co-sign with.
      const secondaryAuthUser = await this.prisma.authUser.findFirst({
        where: { clientId: clientDbId, holderType: 'SECONDARY' },
      });
      if (!secondaryAuthUser) {
        throw new BadRequestException(
          'This account requires a co-signature from the secondary holder, but they have not yet set up their own login. Please ask them to use their invite link before requesting a withdrawal.',
        );
      }
    }

    const mandateNote = client.type === 'JOINT'
      ? isAndMandate
        ? 'Joint AND mandate — awaiting co-signature from the other holder'
        : 'Joint OR mandate — single-holder authorization'
      : 'Single-signatory authorization';

    const isSingleSignatory = client.type === 'INDIVIDUAL' || client.type === 'CORPORATE';

    if (isSingleSignatory) {
      // One-way execution for single-signatory accounts (INDIVIDUAL, CORPORATE):
      // Client request → validation → immediate execution (auto-disbursement)
      return this.executeWithdrawal(clientDbId, requesterAuthUserId, {
        amountKobo,
        bankName: dto.bankName,
        bankAcctNo: dto.bankAcctNo,
        bankAcctName: dto.bankAcctName,
        mandateNote,
        mandate,
        clientType: client.type,
      });
    }

    // JOINT OR mandate: goes to admin queue, no co-sign required
    const isOrMandate = client.type === 'JOINT' && mandate === 'OR';

    if (isOrMandate) {
      // JOINT OR mandate: goes to admin queue, no co-sign required
      const result = await this.prisma.$transaction(async (tx) => {
        const debited = await tx.client.updateMany({
          where: { id: clientDbId, walletBalance: { gte: amountKobo } },
          data: {
            walletBalance: { decrement: amountKobo },
            pendingBalance: { increment: amountKobo },
          },
        });
        if (debited.count === 0) {
          throw new BadRequestException('Insufficient wallet balance');
        }
        return tx.walletTransaction.create({
          data: {
            txnRef: `WAL-WD-${Date.now()}`,
            clientId: clientDbId,
            type: 'WALLET_WITHDRAWAL',
            status: 'PENDING',
            amountKobo,
            description: `Withdrawal to bank account (${mandateNote})`,
            bankName: dto.bankName,
            bankAcctNo: dto.bankAcctNo,
            bankAcctName: dto.bankAcctName,
            requestedByAuthUserId: requesterAuthUserId,
            requiresCoSign: false,
          },
        });
      });

      try {
        await this.prisma.activityLog.create({
          data: {
            clientId: clientDbId,
            action: 'WALLET_WITHDRAWAL_REQUESTED',
            description: `Withdrawal of ₦${(Number(amountKobo) / 100).toLocaleString()} requested to ${dto.bankName} (${dto.bankAcctNo}) — ${mandateNote}`,
            amountKobo,
            metadata: { mandate, clientType: client.type, requiresCoSign: false } as any,
          },
        });
      } catch (err) {
        this.logger.warn(`ActivityLog write failed for withdrawal request: ${(err as Error).message}`);
      }

      // Notifications for JOINT OR mandate
      const requesterAuthUser = await this.prisma.authUser.findUnique({ where: { id: requesterAuthUserId } });
      const requesterIsPrimary = requesterAuthUser?.holderType !== 'SECONDARY';
      const requesterEmail = requesterAuthUser?.email || client.email;
      const requesterName = requesterIsPrimary ? client.name : (client.secondaryName || 'Co-holder');

      this.notifications.sendWithdrawalRequestedEmail(requesterEmail, requesterName, Number(amountKobo) / 100, false).catch(() => {});
      this.notifications.notifyAdminsByRole(
        ['SUPER_ADMIN', 'FINANCE'],
        'New Withdrawal Request Pending Approval (Joint OR)',
        `<p>${client.name} (${client.clientRef}) has requested a withdrawal of ₦${(Number(amountKobo) / 100).toLocaleString()} to ${dto.bankName} (${dto.bankAcctNo}). It is awaiting approval in the Withdrawals Queue.</p>`,
      ).catch(() => {});

      return result;
    }

    // JOINT AND mandate: requires co-signature from other holder before admin can approve
    const result = await this.prisma.$transaction(async (tx) => {
      // Atomic debit — the WHERE walletBalance >= amount guard makes concurrent
      // withdrawals safe: two racing requests can never both pass the balance
      // check and overdraw the wallet. Whichever loses the conditional update
      // gets a 0-count and fails closed.
      const debited = await tx.client.updateMany({
        where: { id: clientDbId, walletBalance: { gte: amountKobo } },
        data: {
          walletBalance: { decrement: amountKobo },
          pendingBalance: { increment: amountKobo },
        },
      });
      if (debited.count === 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      return tx.walletTransaction.create({
        data: {
          txnRef: `WAL-WD-${Date.now()}`,
          clientId: clientDbId,
          type: 'WALLET_WITHDRAWAL',
          status: 'PENDING',
          amountKobo,
          description: `Withdrawal to bank account (${mandateNote})`,
          bankName: dto.bankName,
          bankAcctNo: dto.bankAcctNo,
          bankAcctName: dto.bankAcctName,
          requestedByAuthUserId: requesterAuthUserId,
          requiresCoSign: true,
        },
      });
    });

    // Auditable trail of every withdrawal request and the mandate basis it
    // was authorized under — never blocks the withdrawal if logging fails.
    try {
      await this.prisma.activityLog.create({
        data: {
          clientId: clientDbId,
          action: 'WALLET_WITHDRAWAL_REQUESTED',
          description: `Withdrawal of ₦${(Number(amountKobo) / 100).toLocaleString()} requested to ${dto.bankName} (${dto.bankAcctNo}) — ${mandateNote}`,
          amountKobo,
          metadata: { mandate, clientType: client.type, requiresCoSign: true } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed for withdrawal request: ${(err as Error).message}`);
    }

    // ── Notifications ────────────────────────────────────────────────────
    const requesterAuthUser = await this.prisma.authUser.findUnique({ where: { id: requesterAuthUserId } });
    const requesterIsPrimary = requesterAuthUser?.holderType !== 'SECONDARY';
    const requesterEmail = requesterAuthUser?.email || client.email;
    const requesterName = requesterIsPrimary ? client.name : (client.secondaryName || 'Co-holder');

    if (isAndMandate) {
      // Find the OTHER holder's AuthUser (not the requester) to notify them
      // they need to co-sign.
      const otherHolder = await this.prisma.authUser.findFirst({
        where: { clientId: clientDbId, id: { not: requesterAuthUserId } },
      });
      const otherHolderName = requesterIsPrimary ? (client.secondaryName || 'Co-holder') : client.name;

      this.notifications.sendWithdrawalRequestedEmail(requesterEmail, requesterName, Number(amountKobo) / 100, true).catch(() => {});
      if (otherHolder?.email) {
        this.notifications.sendWithdrawalCoSignNeededEmail(otherHolder.email, otherHolderName, requesterName, Number(amountKobo) / 100).catch(() => {});
      }
    } else {
      // Normal withdrawal executed immediately — notify client it's processing
      this.notifications.sendWithdrawalRequestedEmail(requesterEmail, requesterName, Number(amountKobo) / 100, false).catch(() => {});
      // Notify admins for visibility (not for approval)
      this.notifications.notifyAdminsByRole(
        ['SUPER_ADMIN', 'FINANCE'],
        'Withdrawal Executed (Normal Account)',
        `<p>${client.name} (${client.clientRef}) has withdrawn ₦${(Number(amountKobo) / 100).toLocaleString()} to ${dto.bankName} (${dto.bankAcctNo}). The withdrawal was auto-executed per normal account rules.</p>`,
      ).catch(() => {});
    }

    return result;
  }

  /**
   * Execute a normal withdrawal immediately (one-way execution for single-signatory
   * and JOINT OR mandate accounts). Performs validation, disbursement via Paystack,
   * and updates balances atomically.
   */
  private async executeWithdrawal(
    clientDbId: string,
    requesterAuthUserId: string,
    dto: {
      amountKobo: bigint;
      bankName: string;
      bankAcctNo: string;
      bankAcctName: string;
      mandateNote: string;
      mandate: string;
      clientType: string;
    },
  ) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.walletBalance < dto.amountKobo) throw new BadRequestException('Insufficient wallet balance');

    const requesterAuthUser = await this.prisma.authUser.findUnique({ where: { id: requesterAuthUserId } });
    const requesterIsPrimary = requesterAuthUser?.holderType !== 'SECONDARY';
    const requesterEmail = requesterAuthUser?.email || client.email;
    const requesterName = requesterIsPrimary ? client.name : (client.secondaryName || 'Co-holder');

    const adminName = 'System (Auto-Execution)';
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const isDemoMode = !secretKey || secretKey.startsWith('sk_test') || process.env.NODE_ENV === 'test';
    const isLiveEnv = process.env.NODE_ENV === 'production';

    if (isLiveEnv && (!secretKey || secretKey.startsWith('sk_test'))) {
      throw new ServiceUnavailableException(
        'Withdrawal disbursement is unavailable: a live Paystack secret key is not configured in this environment.',
      );
    }

    const transferRef = `WAL-WD-AUTO-${Date.now()}`;

    try {
      let transferCode: string | null = null;

      if (isDemoMode) {
        this.logger.log(`[WITHDRAWAL_AUTO] Demo mode — simulating disbursement for client=${clientDbId}`);
        transferCode = `DEMO-${transferRef}`;
      } else {
        const bankCode = await this.resolveBankCode(dto.bankName || '', secretKey);
        if (!bankCode) {
          throw new BadRequestException(
            `Could not resolve a bank code for "${dto.bankName}". Please verify the bank name with the client and try again.`,
          );
        }
        const recipient = await this.createTransferRecipient(dto.bankAcctName || '', dto.bankAcctNo || '', bankCode, secretKey);
        const transfer = await this.initiateTransfer(recipient.recipient_code, dto.amountKobo, `Prodigy Finance withdrawal`, transferRef, secretKey);
        transferCode = transfer.transfer_code || transferRef;
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        // Atomic debit from wallet balance directly (no pending balance for auto-execution)
        const debited = await tx.client.updateMany({
          where: { id: clientDbId, walletBalance: { gte: dto.amountKobo } },
          data: { walletBalance: { decrement: dto.amountKobo } },
        });
        if (debited.count === 0) {
          throw new BadRequestException('Insufficient wallet balance');
        }
        return tx.walletTransaction.create({
          data: {
            txnRef: `WAL-WD-AUTO-${Date.now()}`,
            clientId: clientDbId,
            type: 'WALLET_WITHDRAWAL',
            status: 'SUCCESSFUL',
            amountKobo: dto.amountKobo,
            approvedAmountKobo: dto.amountKobo,
            disbursedAmountKobo: dto.amountKobo,
            description: `Withdrawal to bank account (${dto.mandateNote}) — auto-executed`,
            bankName: dto.bankName,
            bankAcctNo: dto.bankAcctNo,
            bankAcctName: dto.bankAcctName,
            processedAt: new Date(),
            initiatedById: 'system',
            approvedById: 'system',
            approvedAt: new Date(),
            paystackTransferCode: transferCode,
          },
        });
      });

      await this.logWithdrawalEvent(
        { id: '', clientId: clientDbId, amountKobo: dto.amountKobo, txnRef: `WAL-WD-AUTO-${Date.now()}` },
        { adminId: 'system', adminName: 'System (Auto-Execution)', adminRole: 'system' },
        'WALLET_WITHDRAWAL_AUTO_EXECUTED',
        'SUCCESS',
        transferCode,
      );

      // Notify client
      this.notifications.sendWithdrawalDisbursedEmail(
        requesterEmail, requesterName, Number(dto.amountKobo) / 100, dto.bankName || '', dto.bankAcctNo || '',
      ).catch(() => {});

      // Notify admins for visibility
      this.notifications.notifyAdminsByRole(
        ['SUPER_ADMIN', 'FINANCE'],
        'Withdrawal Auto-Executed (Normal Account)',
        `<p>${client.name} (${client.clientRef}) withdrew ₦${(Number(dto.amountKobo) / 100).toLocaleString()} to ${dto.bankName} (${dto.bankAcctNo}). Auto-executed per normal account rules.</p>`,
      ).catch(() => {});

      return { status: 'SUCCESSFUL', amountKobo: dto.amountKobo, transferCode };
    } catch (err: any) {
      // Disbursement failed — funds remain in wallet (no pending balance to return)
      const reason = err?.message || 'Disbursement failed';
      this.logger.warn(`[WITHDRAWAL_AUTO] Failed for client=${clientDbId}: ${reason}`);

      await this.logWithdrawalEvent(
        { id: '', clientId: clientDbId, amountKobo: dto.amountKobo, txnRef: `WAL-WD-AUTO-${Date.now()}` },
        { adminId: 'system', adminName: 'System (Auto-Execution)', adminRole: 'system' },
        'WALLET_WITHDRAWAL_AUTO_FAILED',
        'FAILED',
        null,
        reason,
      );

      this.notifications.sendWithdrawalRejectedEmail(
        requesterEmail, requesterName, Number(dto.amountKobo) / 100, `Auto-disbursement failed: ${reason}`,
      ).catch(() => {});

      throw new BadRequestException(`Withdrawal failed: ${reason}`);
    }
  }

  /**
   * Resolve a free-typed bank name to a Paystack bank code.
   * 1) Try Paystack's live /bank list (cached in-memory for the process
   *    lifetime — bank codes essentially never change).
   * 2) Fall back to the static NIGERIAN_BANK_CODES table for common name
   *    variants the live list's exact-match might miss (abbreviations,
   *    punctuation, "Plc"/"Limited" suffixes, etc).
   */
  private bankListCache: { code: string; name: string }[] | null = null;

  private async resolveBankCode(bankName: string, secretKey: string): Promise<string | null> {
    const normalized = normalizeBankName(bankName);
    if (!normalized) return null;

    try {
      if (!this.bankListCache) {
        const resp = await fetch('https://api.paystack.co/bank?country=nigeria', {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        const body = (await resp.json()) as any;
        if (body?.status && Array.isArray(body.data)) {
          this.bankListCache = body.data.map((b: any) => ({ code: b.code, name: b.name }));
        }
      }
      const exact = this.bankListCache?.find((b) => normalizeBankName(b.name) === normalized);
      if (exact) return exact.code;
      const partial = this.bankListCache?.find(
        (b) => normalizeBankName(b.name).includes(normalized) || normalized.includes(normalizeBankName(b.name)),
      );
      if (partial) return partial.code;
    } catch (err: any) {
      this.logger.warn(`[BANK_LOOKUP] Live Paystack bank list unavailable (${err.message}) — using static fallback table.`);
    }

    return lookupBankCodeFallback(bankName);
  }

  private async createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string,
    secretKey: string,
  ): Promise<{ recipient_code: string }> {
    const resp = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'nuban', name, account_number: accountNumber, bank_code: bankCode, currency: 'NGN' }),
    });
    const body = (await resp.json()) as any;
    if (!body?.status) {
      throw new BadRequestException(`Could not verify destination bank account: ${body?.message || 'Unknown error'}`);
    }
    return body.data;
  }

  private async initiateTransfer(
    recipientCode: string,
    amountKobo: bigint,
    reason: string,
    reference: string,
    secretKey: string,
  ): Promise<{ transfer_code?: string; status: string; reference: string }> {
    const resp = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        amount: Number(amountKobo),
        recipient: recipientCode,
        reason,
        reference,
      }),
    });
    const body = (await resp.json()) as any;
    if (!body?.status) {
      throw new BadRequestException(`Paystack transfer could not be initiated: ${body?.message || 'Unknown error'}`);
    }
    return { ...body.data, reference };
  }

  /**
   * Admin/finance approves a PENDING withdrawal — this single action both
   * approves AND triggers the Paystack disbursement automatically (no
   * separate manual "pay out" step). On any failure (bad bank details,
   * Paystack error, etc.) the withdrawal is marked FAILED and the funds are
   * returned to the client's available wallet balance — a withdrawal must
   * never leave money stuck in limbo.
   */
  async approveWithdrawal(transactionId: string, admin: { adminId: string; adminRole: string }) {
    const txn = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.type !== 'WALLET_WITHDRAWAL') throw new BadRequestException('This action only applies to withdrawal transactions.');
    if (txn.status !== 'PENDING') throw new BadRequestException(`This withdrawal is already ${txn.status.toLowerCase()}.`);
    if (txn.requiresCoSign && !txn.coSignedByAuthUserId) {
      throw new BadRequestException(
        'This withdrawal is still awaiting co-signature from the other account holder and cannot be approved yet.',
      );
    }

    const adminName = await this.resolveAdminName(admin.adminId);
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const isDemoMode = !secretKey || secretKey.startsWith('sk_test') || process.env.NODE_ENV === 'test';
    const isLiveEnv = process.env.NODE_ENV === 'production';

    // Fail closed in production: without a live Paystack secret key we can
    // never actually disburse, and the demo-mode path below would mark a
    // withdrawal SUCCESSFUL and clear the client's pending balance for money
    // that was never paid out. We refuse instead.
    if (isLiveEnv && (!secretKey || secretKey.startsWith('sk_test'))) {
      throw new ServiceUnavailableException(
        'Withdrawal disbursement is unavailable: a live Paystack secret key is not configured in this environment.',
      );
    }

    // Atomic claim — grab the transaction BEFORE any external call. Two admins
    // (or a double-click) can never both reach the disbursement call: only the
    // first conditional update wins, and the loser fails with a clean error
    // instead of racing to mark the same withdrawal SUCCESSFUL or FAILED.
    const claimed = await this.prisma.walletTransaction.updateMany({
      where: { id: txn.id, status: 'PENDING', initiatedById: null },
      data: { initiatedById: admin.adminId },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.walletTransaction.findUnique({ where: { id: txn.id } });
      if (!current) throw new NotFoundException('Transaction not found');
      throw new BadRequestException(`This withdrawal is already ${current.status.toLowerCase()} and cannot be processed again.`);
    }

    const transferRef = `WAL-WD-PAYOUT-${txn.id.slice(-8)}-${Date.now()}`;

    try {
      let transferCode: string | null = null;

      if (isDemoMode) {
        // Demo/test mode — simulate a successful payout without calling Paystack,
        // matching the same demo-mode contract used for funding & BVN verification.
        this.logger.log(`[WITHDRAWAL_APPROVE] Demo mode — simulating disbursement for txn=${txn.id}`);
        transferCode = `DEMO-${transferRef}`;
      } else {
        const bankCode = await this.resolveBankCode(txn.bankName || '', secretKey);
        if (!bankCode) {
          throw new BadRequestException(
            `Could not resolve a bank code for "${txn.bankName}". Please verify the bank name with the client and try again.`,
          );
        }
        const recipient = await this.createTransferRecipient(txn.bankAcctName || '', txn.bankAcctNo || '', bankCode, secretKey);
        const transfer = await this.initiateTransfer(recipient.recipient_code, txn.amountKobo, `Prodigy Finance withdrawal ${txn.txnRef}`, transferRef, secretKey);
        transferCode = transfer.transfer_code || transferRef;
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        // Guarded decrement — pendingBalance can never go negative even if the
        // same withdrawal were somehow attempted twice.
        const cleared = await tx.client.updateMany({
          where: { id: txn.clientId, pendingBalance: { gte: txn.amountKobo } },
          data: { pendingBalance: { decrement: txn.amountKobo } },
        });
        if (cleared.count === 0) {
          throw new BadRequestException('Client pending balance is insufficient to complete this withdrawal.');
        }
        return tx.walletTransaction.update({
          where: { id: txn.id },
          data: {
            status: 'SUCCESSFUL',
            paystackTransferCode: transferCode,
            initiatedById: admin.adminId,
            approvedById: admin.adminId,
            approvedAt: new Date(),
            approvedAmountKobo: txn.amountKobo,
            disbursedAmountKobo: txn.amountKobo,
            processedAt: new Date(),
            description: `${txn.description || 'Withdrawal'} — approved & disbursed by ${adminName}`,
          },
        });
      });

      await this.logWithdrawalEvent(txn, { ...admin, adminName }, 'WALLET_WITHDRAWAL_APPROVED', 'SUCCESS', transferCode);

      const client = await this.prisma.client.findUnique({ where: { id: txn.clientId } });
      if (client) {
        const recipient = await this.resolveWithdrawalRecipient(txn, client);
        this.notifications.sendWithdrawalDisbursedEmail(
          recipient.email, recipient.name, Number(txn.amountKobo) / 100, txn.bankName || '', txn.bankAcctNo || '',
        ).catch(() => {});
      }

      return updated;
    } catch (err: any) {
      // Disbursement failed — return funds to the client's available balance
      // rather than leaving them stranded in pendingBalance indefinitely.
      const reason = err?.message || 'Disbursement failed';
      const failed = await this.prisma.$transaction(async (tx) => {
        const returned = await tx.client.updateMany({
          where: { id: txn.clientId, pendingBalance: { gte: txn.amountKobo } },
          data: {
            pendingBalance: { decrement: txn.amountKobo },
            walletBalance: { increment: txn.amountKobo },
          },
        });
        if (returned.count === 0) {
          throw new BadRequestException('Client pending balance is insufficient to return these funds.');
        }
        return tx.walletTransaction.update({
          where: { id: txn.id },
          data: {
            status: 'FAILED',
            failureReason: reason,
            initiatedById: admin.adminId,
            approvedById: admin.adminId,
            approvedAt: new Date(),
            processedAt: new Date(),
            description: `${txn.description || 'Withdrawal'} — disbursement failed, funds returned to wallet`,
          },
        });
      });
      await this.logWithdrawalEvent(txn, { ...admin, adminName }, 'WALLET_WITHDRAWAL_FAILED', 'FAILED', null, reason);
      this.logger.warn(`[WITHDRAWAL_APPROVE] Failed for txn=${txn.id}: ${reason}`);

      const client = await this.prisma.client.findUnique({ where: { id: txn.clientId } });
      if (client) {
        const recipient = await this.resolveWithdrawalRecipient(txn, client);
        this.notifications.sendWithdrawalRejectedEmail(
          recipient.email, recipient.name, Number(txn.amountKobo) / 100, `Disbursement failed: ${reason}`,
        ).catch(() => {});
      }

      return failed;
    }
  }

  /** Admin/finance rejects a PENDING withdrawal — funds return to wallet balance immediately. */
  async rejectWithdrawal(transactionId: string, admin: { adminId: string; adminRole: string }, reason: string) {
    const txn = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.type !== 'WALLET_WITHDRAWAL') throw new BadRequestException('This action only applies to withdrawal transactions.');
    if (txn.status !== 'PENDING') throw new BadRequestException(`This withdrawal is already ${txn.status.toLowerCase()}.`);

    const adminName = await this.resolveAdminName(admin.adminId);

    // Atomic claim — a concurrent double-reject must never reverse the same
    // withdrawal twice (that would refund the pendingBalance into the wallet
    // twice and mint balance).
    const claimed = await this.prisma.walletTransaction.updateMany({
      where: { id: txn.id, status: 'PENDING', initiatedById: null },
      data: { initiatedById: admin.adminId },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.walletTransaction.findUnique({ where: { id: txn.id } });
      if (!current) throw new NotFoundException('Transaction not found');
      throw new BadRequestException(`This withdrawal is already ${current.status.toLowerCase()} and cannot be rejected again.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Guarded reversal — pendingBalance can never go negative.
      const returned = await tx.client.updateMany({
        where: { id: txn.clientId, pendingBalance: { gte: txn.amountKobo } },
        data: {
          pendingBalance: { decrement: txn.amountKobo },
          walletBalance: { increment: txn.amountKobo },
        },
      });
      if (returned.count === 0) {
        throw new BadRequestException('Client pending balance is insufficient to reverse this withdrawal.');
      }
      return tx.walletTransaction.update({
        where: { id: txn.id },
        data: {
          status: 'REVERSED',
          failureReason: reason || 'Rejected by admin',
          initiatedById: admin.adminId,
          approvedById: admin.adminId,
          approvedAt: new Date(),
          processedAt: new Date(),
          description: `${txn.description || 'Withdrawal'} — rejected by ${adminName}: ${reason || 'No reason given'}`,
        },
      });
    });

    await this.logWithdrawalEvent(txn, { ...admin, adminName }, 'WALLET_WITHDRAWAL_REJECTED', 'FAILED', null, reason);

    const client = await this.prisma.client.findUnique({ where: { id: txn.clientId } });
    if (client) {
      const recipient = await this.resolveWithdrawalRecipient(txn, client);
      this.notifications.sendWithdrawalRejectedEmail(
        recipient.email, recipient.name, Number(txn.amountKobo) / 100, reason,
      ).catch(() => {});
    }

    return updated;
  }

  // ════════════════════════════════════════════════════════════════════
  // JOINT HOLDER CO-SIGNATURE (AND mandate)
  // ════════════════════════════════════════════════════════════════════

  /** Withdrawals on this client's account awaiting the *current* holder's co-signature (not their own request). */
  async getPendingCosignForHolder(clientDbId: string, authUserId: string) {
    return this.prisma.walletTransaction.findMany({
      where: {
        clientId: clientDbId,
        type: 'WALLET_WITHDRAWAL',
        status: 'PENDING',
        requiresCoSign: true,
        coSignedByAuthUserId: null,
        requestedByAuthUserId: { not: authUserId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The other joint holder approves a withdrawal — this is the real "second signature". */
  async cosignWithdrawal(transactionId: string, clientDbId: string, authUserId: string) {
    const txn = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
    if (!txn || txn.clientId !== clientDbId) throw new NotFoundException('Withdrawal request not found');
    if (txn.type !== 'WALLET_WITHDRAWAL') throw new BadRequestException('This action only applies to withdrawal requests.');
    if (!txn.requiresCoSign) throw new BadRequestException('This withdrawal does not require a co-signature.');
    if (txn.coSignedByAuthUserId) throw new BadRequestException('This withdrawal has already been co-signed.');
    if (txn.status !== 'PENDING') throw new BadRequestException(`This withdrawal is already ${txn.status.toLowerCase()}.`);
    if (txn.requestedByAuthUserId === authUserId) {
      throw new BadRequestException('You initiated this withdrawal — the other account holder must co-sign it, not you.');
    }

    const updated = await this.prisma.walletTransaction.update({
      where: { id: txn.id },
      data: {
        coSignedByAuthUserId: authUserId,
        coSignedAt: new Date(),
        description: `${txn.description || 'Withdrawal'} — co-signed, awaiting admin disbursement`,
      },
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          clientId: clientDbId,
          action: 'WALLET_WITHDRAWAL_COSIGNED',
          description: `Withdrawal ${txn.txnRef} co-signed by the second account holder — now ready for review.`,
          amountKobo: txn.amountKobo,
          metadata: { txnRef: txn.txnRef, coSignedByAuthUserId: authUserId } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed for co-sign: ${(err as Error).message}`);
    }

    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (client && txn.requestedByAuthUserId) {
      const requester = await this.resolveWithdrawalRecipient(txn, client);
      this.notifications.sendWithdrawalCoSignedEmail(requester.email, requester.name, Number(txn.amountKobo) / 100).catch(() => {});
    }
    if (client) {
      this.notifications.notifyAdminsByRole(
        ['SUPER_ADMIN', 'FINANCE'],
        'Withdrawal Co-Signed — Ready for Review',
        `<p>${client.name} (${client.clientRef})'s withdrawal of ₦${(Number(txn.amountKobo) / 100).toLocaleString()} has been co-signed by both holders and is now ready for review in the Withdrawals Queue.</p>`,
      ).catch(() => {});
    }

    return updated;
  }

  /** The other joint holder declines a withdrawal — funds return to wallet balance immediately. */
  async declineCosignWithdrawal(transactionId: string, clientDbId: string, authUserId: string, reason?: string) {
    const txn = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
    if (!txn || txn.clientId !== clientDbId) throw new NotFoundException('Withdrawal request not found');
    if (txn.type !== 'WALLET_WITHDRAWAL') throw new BadRequestException('This action only applies to withdrawal requests.');
    if (!txn.requiresCoSign) throw new BadRequestException('This withdrawal does not require a co-signature.');
    if (txn.coSignedByAuthUserId) throw new BadRequestException('This withdrawal has already been co-signed.');
    if (txn.status !== 'PENDING') throw new BadRequestException(`This withdrawal is already ${txn.status.toLowerCase()}.`);
    if (txn.requestedByAuthUserId === authUserId) {
      throw new BadRequestException('You initiated this withdrawal — only the other account holder can decline it.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientDbId },
        data: {
          pendingBalance: { decrement: txn.amountKobo },
          walletBalance: { increment: txn.amountKobo },
        },
      });
      return tx.walletTransaction.update({
        where: { id: txn.id },
        data: {
          status: 'REVERSED',
          failureReason: reason || 'Declined by co-signing holder',
          description: `${txn.description || 'Withdrawal'} — declined by the other account holder${reason ? `: ${reason}` : ''}`,
        },
      });
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          clientId: clientDbId,
          action: 'WALLET_WITHDRAWAL_COSIGN_DECLINED',
          description: `Withdrawal ${txn.txnRef} declined by the second account holder — funds returned to wallet.`,
          amountKobo: txn.amountKobo,
          metadata: { txnRef: txn.txnRef, declinedByAuthUserId: authUserId, reason } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed for co-sign decline: ${(err as Error).message}`);
    }

    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (client && txn.requestedByAuthUserId) {
      const requester = await this.resolveWithdrawalRecipient(txn, client);
      this.notifications.sendWithdrawalCoSignDeclinedEmail(requester.email, requester.name, Number(txn.amountKobo) / 100, reason).catch(() => {});
    }

    return updated;
  }

  /** Resolve who should be emailed about a withdrawal's status — the original
   * requester's own login if known (could be the secondary holder), else the
   * primary holder's contact on the client record. */
  private async resolveWithdrawalRecipient(
    txn: { requestedByAuthUserId?: string | null },
    client: { email: string; name: string; secondaryName?: string | null },
  ): Promise<{ email: string; name: string }> {
    if (txn.requestedByAuthUserId) {
      const requester = await this.prisma.authUser.findUnique({ where: { id: txn.requestedByAuthUserId } });
      if (requester?.email) {
        const name = requester.holderType === 'SECONDARY' ? (client.secondaryName || 'Co-holder') : client.name;
        return { email: requester.email, name };
      }
    }
    return { email: client.email, name: client.name };
  }

  /** Look up an admin's display name for audit/ledger descriptions, with a safe fallback. */
  private async resolveAdminName(adminId?: string | null): Promise<string> {
    if (!adminId) return 'Unknown Admin';
    try {
      const adminUser = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
      return adminUser?.name || 'Unknown Admin';
    } catch {
      return 'Unknown Admin';
    }
  }

  /** Auditable trail (admin-facing AuditLog + client-facing ActivityLog) for every withdrawal decision. */
  private async logWithdrawalEvent(
    txn: { id: string; clientId: string; amountKobo: bigint; txnRef: string },
    admin: { adminId: string; adminName: string; adminRole: string },
    action: string,
    outcome: 'SUCCESS' | 'FAILED',
    transferCode?: string | null,
    reason?: string,
  ) {
    const amountNaira = (Number(txn.amountKobo) / 100).toLocaleString();
    const description =
      outcome === 'SUCCESS'
        ? `₦${amountNaira} withdrawal disbursed via Paystack (ref: ${txn.txnRef}${transferCode ? `, transfer: ${transferCode}` : ''})`
        : `₦${amountNaira} withdrawal ${action === 'WALLET_WITHDRAWAL_REJECTED' ? 'rejected' : 'failed'} (ref: ${txn.txnRef})${reason ? ` — ${reason}` : ''}`;

    try {
      await this.prisma.activityLog.create({
        data: { clientId: txn.clientId, action, description, amountKobo: txn.amountKobo, metadata: { txnRef: txn.txnRef, transferCode, reason, outcome } as any },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed: ${(err as Error).message}`);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: admin.adminId,
          adminName: admin.adminName,
          adminRole: admin.adminRole,
          action,
          targetEntity: txn.id,
          category: 'FINANCE',
          metadata: { clientId: txn.clientId, txnRef: txn.txnRef, amountKobo: Number(txn.amountKobo), transferCode, reason, outcome } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`AuditLog write failed: ${(err as Error).message}`);
    }
  }

  // Admin: get all transactions with filters + date range + pagination
  async adminGetAll(query?: {
    search?: string;
    type?: string;
    status?: string;
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    clientId?: string;
  }) {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(200, Math.max(1, query?.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: any = {
      ...(query?.type && { type: query.type as any }),
      ...(query?.status && { status: query.status as any }),
      ...(query?.clientId && { clientId: query.clientId }),
      ...(query?.search && {
        OR: [
          { txnRef: { contains: query.search, mode: 'insensitive' } },
          { client: { name: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    if (query?.dateFrom || query?.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        const from = new Date(query.dateFrom);
        if (isNaN(from.getTime())) throw new BadRequestException('Invalid dateFrom');
        where.createdAt.gte = from;
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        if (isNaN(to.getTime())) throw new BadRequestException('Invalid dateTo');
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: {
          client: { select: { id: true, clientRef: true, name: true, email: true, type: true } },
          investment: { select: { id: true, investRef: true, product: { select: { name: true } } } },
          relatedTransaction: { select: { id: true, txnRef: true, type: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  // ════════════════════════════════════════════════════════════════════
  // TRANSACTION REVERSAL / ADJUSTMENT
  // ════════════════════════════════════════════════════════════════════

  /**
   * Reverse a completed transaction (e.g., withdrawal, funding, subscription).
   * Creates a reversal transaction linked to the original via relatedTransactionId.
   * Atomically adjusts wallet/pending balances.
   */
  async reverseTransaction(
    transactionId: string,
    admin: { adminId: string; adminRole: string },
    reason: string,
  ) {
    const originalTxn = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!originalTxn) throw new NotFoundException('Transaction not found');

    // Only certain transaction types can be reversed
    const reversibleTypes = ['WALLET_WITHDRAWAL', 'WALLET_FUNDING', 'SUBSCRIPTION', 'REDEMPTION', 'PRE_TERMINATION_PAYOUT', 'DIVIDEND_PAYOUT'];
    if (!reversibleTypes.includes(originalTxn.type)) {
      throw new BadRequestException(`Transaction type ${originalTxn.type} cannot be reversed.`);
    }

    // Check if already reversed
    if (originalTxn.status === 'REVERSED') {
      throw new BadRequestException('This transaction has already been reversed.');
    }

    // Check if there's already a reversal for this transaction
    const existingReversal = await this.prisma.walletTransaction.findFirst({
      where: { relatedTransactionId: originalTxn.id },
    });
    if (existingReversal) {
      throw new BadRequestException('A reversal for this transaction already exists.');
    }

    // Cannot reverse a failed or pending transaction
    if (originalTxn.status !== 'SUCCESSFUL') {
      throw new BadRequestException(`Only SUCCESSFUL transactions can be reversed. Current status: ${originalTxn.status}`);
    }

    const adminName = await this.resolveAdminName(admin.adminId);
    const reversalRef = `WAL-REV-${originalTxn.txnRef}-${Date.now()}`;

    // Determine balance adjustments based on original transaction type
    const isCredit = ['WALLET_FUNDING', 'REDEMPTION', 'PRE_TERMINATION_PAYOUT', 'DIVIDEND_PAYOUT'].includes(originalTxn.type);
    const isDebit = ['WALLET_WITHDRAWAL', 'SUBSCRIPTION'].includes(originalTxn.type);

    const reversal = await this.prisma.$transaction(async (tx) => {
      // Adjust balances atomically
      if (isCredit) {
        // Original was a credit → debit wallet balance
        const debited = await tx.client.updateMany({
          where: { id: originalTxn.clientId, walletBalance: { gte: originalTxn.amountKobo } },
          data: { walletBalance: { decrement: originalTxn.amountKobo } },
        });
        if (debited.count === 0) {
          throw new BadRequestException('Insufficient wallet balance to reverse this credit transaction.');
        }
      } else if (isDebit) {
        // Original was a debit → credit wallet balance
        await tx.client.update({
          where: { id: originalTxn.clientId },
          data: { walletBalance: { increment: originalTxn.amountKobo } },
        });
      }

      // Create the reversal transaction
      const reversalTxn = await tx.walletTransaction.create({
        data: {
          txnRef: reversalRef,
          clientId: originalTxn.clientId,
          type: originalTxn.type,
          status: 'REVERSED',
          amountKobo: originalTxn.amountKobo,
          description: `Reversal of ${originalTxn.txnRef}: ${reason}`,
          relatedTransactionId: originalTxn.id,
          initiatedById: admin.adminId,
          approvedById: admin.adminId,
          approvedAt: new Date(),
          processedAt: new Date(),
          metadata: { originalTxnRef: originalTxn.txnRef, reversalReason: reason } as any,
        },
      });

      // Update original transaction status
      await tx.walletTransaction.update({
        where: { id: originalTxn.id },
        data: {
          status: 'REVERSED',
          failureReason: reason,
          description: `${originalTxn.description || originalTxn.type} — reversed by ${adminName}: ${reason}`,
        },
      });

      return reversalTxn;
    });

    // Audit trail
    try {
      await this.prisma.activityLog.create({
        data: {
          clientId: originalTxn.clientId,
          action: 'TRANSACTION_REVERSED',
          description: `Transaction ${originalTxn.txnRef} reversed by admin: ${reason}`,
          amountKobo: originalTxn.amountKobo,
          metadata: { originalTxnRef: originalTxn.txnRef, reversalRef, reversalReason: reason } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed for reversal: ${(err as Error).message}`);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: admin.adminId,
          adminName,
          adminRole: admin.adminRole,
          action: 'TRANSACTION_REVERSED',
          targetEntity: originalTxn.id,
          category: 'FINANCE',
          metadata: { clientId: originalTxn.clientId, originalTxnRef: originalTxn.txnRef, reversalRef, amountKobo: Number(originalTxn.amountKobo), reason } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`AuditLog write failed for reversal: ${(err as Error).message}`);
    }

    return reversal;
  }

  /**
   * Adjust a transaction by creating a corrected version.
   * The original transaction remains, an adjustment reversal is created,
   * and a new corrected transaction is created.
   */
  async adjustTransaction(
    transactionId: string,
    admin: { adminId: string; adminRole: string },
    dto: { correctedAmountKobo: bigint; correctedDescription?: string; reason: string },
  ) {
    const originalTxn = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!originalTxn) throw new NotFoundException('Transaction not found');

    // Only certain transaction types can be adjusted
    const adjustableTypes = ['WALLET_WITHDRAWAL', 'WALLET_FUNDING', 'SUBSCRIPTION', 'REDEMPTION', 'PRE_TERMINATION_PAYOUT', 'DIVIDEND_PAYOUT'];
    if (!adjustableTypes.includes(originalTxn.type)) {
      throw new BadRequestException(`Transaction type ${originalTxn.type} cannot be adjusted.`);
    }

    // Cannot adjust a failed, pending, or already reversed transaction
    if (originalTxn.status !== 'SUCCESSFUL') {
      throw new BadRequestException(`Only SUCCESSFUL transactions can be adjusted. Current status: ${originalTxn.status}`);
    }

    // Check if already adjusted
    const existingAdjustment = await this.prisma.walletTransaction.findFirst({
      where: { relatedTransactionId: originalTxn.id, metadata: { path: ['adjustment'], equals: true } },
    });
    if (existingAdjustment) {
      throw new BadRequestException('This transaction has already been adjusted.');
    }

    if (dto.correctedAmountKobo <= BigInt(0)) {
      throw new BadRequestException('Corrected amount must be greater than zero.');
    }

    const adminName = await this.resolveAdminName(admin.adminId);
    const adjustmentRef = `WAL-ADJ-${originalTxn.txnRef}-${Date.now()}`;
    const correctedRef = `WAL-COR-${originalTxn.txnRef}-${Date.now()}`;

    // Determine balance adjustments
    const isCredit = ['WALLET_FUNDING', 'REDEMPTION', 'PRE_TERMINATION_PAYOUT', 'DIVIDEND_PAYOUT'].includes(originalTxn.type);
    const isDebit = ['WALLET_WITHDRAWAL', 'SUBSCRIPTION'].includes(originalTxn.type);
    const amountDelta = dto.correctedAmountKobo - originalTxn.amountKobo; // positive = need more credit, negative = need debit

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create reversal of original
      const reversalTxn = await tx.walletTransaction.create({
        data: {
          txnRef: adjustmentRef,
          clientId: originalTxn.clientId,
          type: originalTxn.type,
          status: 'REVERSED',
          amountKobo: originalTxn.amountKobo,
          description: `Adjustment reversal of ${originalTxn.txnRef}: ${dto.reason}`,
          relatedTransactionId: originalTxn.id,
          initiatedById: admin.adminId,
          approvedById: admin.adminId,
          approvedAt: new Date(),
          processedAt: new Date(),
          metadata: { originalTxnRef: originalTxn.txnRef, adjustmentReason: dto.reason, adjustment: true } as any,
        },
      });

      // 2. Apply balance adjustment for the reversal
      if (isCredit) {
        // Original was credit → debit original amount
        const debited = await tx.client.updateMany({
          where: { id: originalTxn.clientId, walletBalance: { gte: originalTxn.amountKobo } },
          data: { walletBalance: { decrement: originalTxn.amountKobo } },
        });
        if (debited.count === 0) {
          throw new BadRequestException('Insufficient wallet balance to reverse original transaction for adjustment.');
        }
      } else if (isDebit) {
        // Original was debit → credit original amount
        await tx.client.update({
          where: { id: originalTxn.clientId },
          data: { walletBalance: { increment: originalTxn.amountKobo } },
        });
      }

      // 3. Create corrected transaction
      const correctedTxn = await tx.walletTransaction.create({
        data: {
          txnRef: correctedRef,
          clientId: originalTxn.clientId,
          type: originalTxn.type,
          status: 'SUCCESSFUL',
          amountKobo: dto.correctedAmountKobo,
          approvedAmountKobo: dto.correctedAmountKobo,
          disbursedAmountKobo: dto.correctedAmountKobo,
          description: dto.correctedDescription || `Corrected version of ${originalTxn.txnRef}: ${dto.reason}`,
          relatedTransactionId: originalTxn.id,
          initiatedById: admin.adminId,
          approvedById: admin.adminId,
          approvedAt: new Date(),
          processedAt: new Date(),
          metadata: { originalTxnRef: originalTxn.txnRef, adjustmentReason: dto.reason, correction: true, correctedFrom: originalTxn.id } as any,
        },
      });

      // 4. Apply balance for corrected transaction
      if (isCredit) {
        await tx.client.update({
          where: { id: originalTxn.clientId },
          data: { walletBalance: { increment: dto.correctedAmountKobo } },
        });
      } else if (isDebit) {
        const debited = await tx.client.updateMany({
          where: { id: originalTxn.clientId, walletBalance: { gte: dto.correctedAmountKobo } },
          data: { walletBalance: { decrement: dto.correctedAmountKobo } },
        });
        if (debited.count === 0) {
          throw new BadRequestException('Insufficient wallet balance for corrected transaction amount.');
        }
      }

      // 5. Update original transaction
      await tx.walletTransaction.update({
        where: { id: originalTxn.id },
        data: {
          status: 'REVERSED',
          failureReason: `Adjusted: ${dto.reason}`,
          description: `${originalTxn.description || originalTxn.type} — adjusted by ${adminName}: ${dto.reason}`,
        },
      });

      return { reversal: reversalTxn, corrected: correctedTxn };
    });

    // Audit trail
    try {
      await this.prisma.activityLog.create({
        data: {
          clientId: originalTxn.clientId,
          action: 'TRANSACTION_ADJUSTED',
          description: `Transaction ${originalTxn.txnRef} adjusted: ₦${Number(originalTxn.amountKobo) / 100} → ₦${Number(dto.correctedAmountKobo) / 100} (${dto.reason})`,
          amountKobo: dto.correctedAmountKobo,
          metadata: { originalTxnRef: originalTxn.txnRef, adjustmentRef, correctedRef, originalAmount: Number(originalTxn.amountKobo), correctedAmount: Number(dto.correctedAmountKobo), reason: dto.reason } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`ActivityLog write failed for adjustment: ${(err as Error).message}`);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: admin.adminId,
          adminName,
          adminRole: admin.adminRole,
          action: 'TRANSACTION_ADJUSTED',
          targetEntity: originalTxn.id,
          category: 'FINANCE',
          metadata: { clientId: originalTxn.clientId, originalTxnRef: originalTxn.txnRef, adjustmentRef, correctedRef, originalAmount: Number(originalTxn.amountKobo), correctedAmount: Number(dto.correctedAmountKobo), reason: dto.reason } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`AuditLog write failed for adjustment: ${(err as Error).message}`);
    }

    return result;
  }
}
