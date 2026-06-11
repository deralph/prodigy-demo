import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PENALTY_RATE = 0.1; // 10% early exit penalty

@Injectable()
export class PreTerminationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string }) {
    const records = await this.prisma.preTermination.findMany({
      where: query.status ? { status: query.status as any } : undefined,
      include: {
        investment: { include: { product: true, client: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });

    // Back-fill penalty for any legacy records created before the upfront-calculation fix
    return records.map(pt => {
      if (pt.penaltyKobo !== BigInt(0)) return pt;
      const principalKobo = pt.investment?.principalKobo ?? BigInt(0);
      const penaltyRate = pt.investment?.product?.earlyExitPenalty
        ? Number(pt.investment.product.earlyExitPenalty) / 100
        : PENALTY_RATE;
      const penaltyKobo   = BigInt(Math.round(Number(principalKobo) * penaltyRate));
      const netPayoutKobo = principalKobo - penaltyKobo;
      return { ...pt, penaltyKobo, netPayoutKobo };
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.preTermination.findUnique({
      where: { id },
      include: { investment: { include: { product: true, client: true } } },
    });
    if (!item) throw new NotFoundException('Pre-termination request not found');
    return item;
  }

  // Ops approves → confirms pre-calculated penalty → routes to FinanceQueue
  async approveOps(id: string, adminId: string) {
    const pt = await this.prisma.preTermination.findUnique({
      where: { id },
      include: { investment: { include: { product: true } } },
    });
    if (!pt) throw new NotFoundException('Pre-termination not found');
    if (pt.status !== 'PENDING_OPS') throw new BadRequestException('Item is not pending ops approval');

    // Use stored penalty (calculated at request creation using product rate)
    // Re-derive only if somehow stored as zero (legacy records)
    let penaltyKobo = pt.penaltyKobo;
    let netPayoutKobo = pt.netPayoutKobo;
    if (penaltyKobo === BigInt(0)) {
      const penaltyRate = pt.investment.product?.earlyExitPenalty
        ? Number(pt.investment.product.earlyExitPenalty) / 100
        : PENALTY_RATE;
      penaltyKobo = BigInt(Math.round(Number(pt.investment.principalKobo) * penaltyRate));
      netPayoutKobo = pt.investment.principalKobo - penaltyKobo;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const preTerm = await tx.preTermination.update({
        where: { id },
        data: {
          status: 'PENDING_FINANCE',
          penaltyKobo,
          netPayoutKobo,
          opsApprovedById: adminId,
          opsApprovedAt: new Date(),
        },
      });

      // Route to Finance Queue
      await tx.financeQueueItem.create({
        data: {
          fqRef: `FQ-${Date.now()}`,
          type: 'Pre-Termination',
          status: 'PENDING',
          clientId: pt.investment.clientId,
          amountKobo: netPayoutKobo,
          penaltyKobo,
          preTermId: id,
          requestedById: adminId,
        },
      });

      await tx.investment.update({
        where: { id: pt.investmentId },
        data: {
          status: 'PRE_TERMINATED',
          history: { create: { action: 'Pre-Termination Approved by Ops', performedById: adminId } },
        },
      });

      return preTerm;
    });

    return updated;
  }

  async rejectOps(id: string, adminId: string, reason: string) {
    const pt = await this.prisma.preTermination.findUnique({ where: { id } });
    if (!pt) throw new NotFoundException('Pre-termination not found');

    return this.prisma.preTermination.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }
}
