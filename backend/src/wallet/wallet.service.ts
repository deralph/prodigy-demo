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

  // Initiate a Paystack payment — creates a PENDING transaction and returns the Paystack auth URL
  async initiatePaystackPayment(clientDbId: string, email: string, amountKobo: bigint) {
    // Random suffix (6 chars) prevents millisecond collisions and duplicate-reference errors
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const reference = `WAL-PS-${clientDbId.slice(-6)}-${Date.now()}-${rand}`;
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn('PAYSTACK_SECRET_KEY not set — returning demo reference');
      // Still persist the PENDING record so the transaction is visible
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
      return { reference, access_code: null, authorization_url: null };
    }

    const resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Number(amountKobo),
        reference,
        metadata: { clientDbId },
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    });
    const result = await resp.json() as any;
    if (!result.status) throw new BadRequestException(result.message || 'Paystack initiation failed');

    // Only persist the PENDING record after Paystack has accepted the reference,
    // preventing orphaned records from failed/abandoned initiations.
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

    return { ...result.data, reference };
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
}
