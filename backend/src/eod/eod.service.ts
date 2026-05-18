import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EodService {
  constructor(private readonly prisma: PrismaService) {}

  async runEod() {
    // EOD processing: accrue interest on active investments, check maturities
    const activeInvestments = await this.prisma.investment.findMany({
      where: { status: 'ACTIVE' },
    });

    let accrued = 0;
    let matured = 0;
    const today = new Date();

    for (const inv of activeInvestments) {
      // Check if maturity date reached
      if (inv.maturityDate && new Date(inv.maturityDate) <= today) {
        await this.prisma.investment.update({
          where: { id: inv.id },
          data: { status: 'MATURED' },
        });
        matured++;
      } else {
        accrued++;
      }
    }

    return {
      status: 'completed',
      runAt: new Date().toISOString(),
      processed: activeInvestments.length,
      accrued,
      matured,
    };
  }

  async getHistory() {
    return this.prisma.eodRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 30,
    });
  }
}
