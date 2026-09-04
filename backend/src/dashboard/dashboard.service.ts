import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard(admin?: { adminUserId?: string; adminRole?: string }) {
    const [
      totalPortfolio,
      equityHoldings,
      fixedIncome,
      marketAppreciation,
      activeInstruments,
      clientStats,
      recentActivity,
    ] = await Promise.all([
      this.getTotalPortfolio(),
      this.getEquityHoldings(),
      this.getFixedIncome(),
      this.getMarketAppreciation(),
      this.getActiveInstruments(),
      this.getClientStats(),
      this.getRecentActivity(),
    ]);

    return {
      metrics: {
        totalPortfolio,
        equityHoldings,
        fixedIncome,
        marketAppreciation,
        activeInstruments,
      },
      clientStats,
      recentActivity,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getTotalPortfolio(): Promise<number> {
    // Total portfolio = sum of all active investment principals (client investments only, not internal)
    const result = await this.prisma.investment.aggregate({
      where: {
        isInternal: false,
        status: { in: ['ACTIVE', 'MATURED', 'PAID_OUT'] },
      },
      _sum: { principalKobo: true },
    });
    return Number(result._sum.principalKobo || 0) / 100;
  }

  private async getEquityHoldings(): Promise<number> {
    // Equity holdings = investments in equity-category products
    const result = await this.prisma.investment.aggregate({
      where: {
        isInternal: false,
        status: { in: ['ACTIVE', 'MATURED', 'PAID_OUT'] },
        product: { category: { equals: 'EQUITY', mode: 'insensitive' } },
      },
      _sum: { principalKobo: true },
    });
    return Number(result._sum.principalKobo || 0) / 100;
  }

  private async getFixedIncome(): Promise<number> {
    // Fixed income = investments in fixed-income-category products
    const result = await this.prisma.investment.aggregate({
      where: {
        isInternal: false,
        status: { in: ['ACTIVE', 'MATURED', 'PAID_OUT'] },
        product: { category: { equals: 'FIXED_INCOME', mode: 'insensitive' } },
      },
      _sum: { principalKobo: true },
    });
    return Number(result._sum.principalKobo || 0) / 100;
  }

  private async getMarketAppreciation(): Promise<number> {
    // Market appreciation = expected total interest across active investments
    // Using product-configured rates, not hardcoded formula
    const investments = await this.prisma.investment.findMany({
      where: {
        isInternal: false,
        status: { in: ['ACTIVE', 'MATURED', 'PAID_OUT'] },
      },
      select: {
        principalKobo: true,
        roiRate: true,
        taxRate: true,
        tenorDays: true,
      },
    });

    let totalExpectedInterest = 0;
    for (const inv of investments) {
      const principal = Number(inv.principalKobo) / 100;
      const roiRate = Number(inv.roiRate);
      const taxRate = Number(inv.taxRate);
      const tenorDays = inv.tenorDays;
      const expectedInterest = principal * roiRate / 100 * tenorDays / 365;
      const expectedTax = expectedInterest * taxRate / 100;
      const expectedNetInterest = expectedInterest - expectedTax;
      totalExpectedInterest += expectedNetInterest;
    }
    return totalExpectedInterest;
  }

  private async getActiveInstruments(): Promise<Array<{
    refId: string;
    instrument: string;
    client: string;
    bookValue: number;
    status: string;
  }>> {
    const investments = await this.prisma.investment.findMany({
      where: {
        isInternal: false,
        status: { in: ['ACTIVE', 'MATURED', 'PAID_OUT', 'PENDING_APPROVAL'] },
      },
      include: {
        product: { select: { name: true } },
        client: { select: { clientRef: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return investments.map(inv => ({
      refId: inv.investRef,
      instrument: inv.product?.name || 'Unknown',
      client: `${inv.client.name} (${inv.client.clientRef})`,
      bookValue: Number(inv.principalKobo) / 100,
      status: inv.status,
    }));
  }

  private async getClientStats(): Promise<{
    totalClients: number;
    activeClients: number;
    pendingKyc: number;
    totalWalletBalance: number;
  }> {
    const [totalClients, activeClients, pendingKyc, walletResult] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: 'ACTIVE' } }),
      this.prisma.client.count({ where: { status: 'PENDING_KYC' } }),
      this.prisma.client.aggregate({ _sum: { walletBalance: true } }),
    ]);

    return {
      totalClients,
      activeClients,
      pendingKyc,
      totalWalletBalance: Number(walletResult._sum.walletBalance || 0) / 100,
    };
  }

  private async getRecentActivity(limit = 10): Promise<Array<{
    type: string;
    description: string;
    amount: number;
    client: string;
    timestamp: Date;
  }>> {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { status: 'SUCCESSFUL' },
      include: {
        client: { select: { clientRef: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions.map(tx => ({
      type: tx.type,
      description: tx.description || tx.type,
      amount: Number(tx.amountKobo) / 100,
      client: `${tx.client.name} (${tx.client.clientRef})`,
      timestamp: tx.createdAt,
    }));
  }

  async getClientDashboard(clientDbId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientDbId },
      include: {
        investments: {
          where: { isInternal: false },
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
        walletTransactions: {
          where: { status: 'SUCCESSFUL' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        kycRecord: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const activeInvestments = client.investments.filter(i => i.status === 'ACTIVE');
    const maturedInvestments = client.investments.filter(i => ['MATURED', 'PAID_OUT'].includes(i.status));
    const pendingInvestments = client.investments.filter(i => i.status === 'PENDING_APPROVAL');

    const totalPrincipal = client.investments.reduce((s, i) => s + Number(i.principalKobo) / 100, 0);
    const activePrincipal = activeInvestments.reduce((s, i) => s + Number(i.principalKobo) / 100, 0);
    const expectedTotalPayout = client.investments.reduce((s, i) => s + this.calculateExpectedPayout(i), 0);

    return {
      client: {
        clientRef: client.clientRef,
        name: client.name,
        email: client.email,
        type: client.type,
        status: client.status,
        walletBalance: Number(client.walletBalance || 0) / 100,
        pendingBalance: Number(client.pendingBalance || 0) / 100,
        kycStatus: client.kycRecord?.status || 'NOT_SUBMITTED',
      },
      portfolio: {
        totalInvestments: client.investments.length,
        activeInvestments: activeInvestments.length,
        maturedInvestments: maturedInvestments.length,
        pendingInvestments: pendingInvestments.length,
        totalPrincipal,
        activePrincipal,
        expectedTotalPayout,
      },
      recentTransactions: client.walletTransactions.map(tx => ({
        txnRef: tx.txnRef,
        type: tx.type,
        status: tx.status,
        amount: Number(tx.amountKobo) / 100,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
      investments: client.investments.map(inv => ({
        investRef: inv.investRef,
        product: inv.product?.name,
        principal: Number(inv.principalKobo) / 100,
        roiRate: Number(inv.roiRate),
        tenorDays: inv.tenorDays,
        maturityDate: inv.maturityDate?.toISOString().split('T')[0] || null,
        status: inv.status,
        expectedPayout: this.calculateExpectedPayout(inv),
      })),
    };
  }

  private calculateExpectedPayout(inv: any): number {
    const principal = Number(inv.principalKobo) / 100;
    const roiRate = Number(inv.roiRate);
    const taxRate = Number(inv.taxRate);
    const tenorDays = inv.tenorDays;
    const expectedInterest = principal * roiRate / 100 * tenorDays / 365;
    const expectedTax = expectedInterest * taxRate / 100;
    const expectedNetInterest = expectedInterest - expectedTax;
    return principal + expectedNetInterest;
  }
}