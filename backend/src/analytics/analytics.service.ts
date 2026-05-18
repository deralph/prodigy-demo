import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [totalClients, totalInvestments, totalTransactions] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.investment.count(),
      this.prisma.walletTransaction.count(),
    ]);
    return { totalClients, totalInvestments, totalTransactions };
  }

  async getInvestmentStats() {
    const investments = await this.prisma.investment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
    });
    return investments;
  }

  async getClientStats() {
    const clients = await this.prisma.client.groupBy({
      by: ['type'],
      _count: true,
    });
    return clients;
  }
}
