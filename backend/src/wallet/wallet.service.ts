import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

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

  // Called after Paystack webhook confirms payment
  async creditWallet(clientDbId: string, amountKobo: bigint, paystackRef: string, description = 'Wallet Funding via Paystack') {
    return this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientDbId },
        data: { walletBalance: { increment: amountKobo } },
      });
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
