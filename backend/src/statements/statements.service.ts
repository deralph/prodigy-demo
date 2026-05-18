import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      balance += t.type === 'CREDIT' ? Number(t.amount) : -Number(t.amount);
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
