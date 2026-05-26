import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CREDIT_TYPES: TransactionType[] = [
  TransactionType.WALLET_FUNDING,
  TransactionType.REDEMPTION,
  TransactionType.PRE_TERMINATION_PAYOUT,
  TransactionType.DIVIDEND_PAYOUT,
  TransactionType.LOAN_DISBURSEMENT,
];

@Injectable()
export class StatementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatements(clientId: string, query: { startDate?: string; endDate?: string }) {
    const where: any = { clientId };

    if (query.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) };
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate running balance
    let balance = 0;
    const statement = transactions.reverse().map(t => {
      const isCredit = CREDIT_TYPES.includes(t.type);
      balance += isCredit ? Number(t.amountKobo) : -Number(t.amountKobo);
      return { ...t, runningBalance: balance };
    });

    return {
      clientId,
      period: { start: query.startDate || 'all', end: query.endDate || 'present' },
      entries: statement.reverse(),
      closingBalance: balance,
    };
  }
}
