import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceQueueService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { status?: string }) {
    return this.prisma.financeQueueItem.findMany({
      where: query.status ? { status: query.status as any } : undefined,
      include: { preTermination: { include: { investment: { include: { product: true, client: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.financeQueueItem.findUnique({
      where: { id },
      include: { preTermination: { include: { investment: { include: { client: true, product: true } } } } },
    });
    if (!item) throw new NotFoundException('Finance queue item not found');
    return item;
  }

  async approve(id: string, adminId: string, notes?: string) {
    const item = await this.prisma.financeQueueItem.findUnique({
      where: { id },
      include: { preTermination: { include: { investment: true } } },
    });
    if (!item) throw new NotFoundException('Finance queue item not found');
    if (item.status !== 'PENDING') throw new BadRequestException('Item is not in pending state');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.financeQueueItem.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: adminId, approvedAt: new Date(), notes },
      });

      // Credit the client wallet with net payout
      await tx.client.update({
        where: { id: item.clientId },
        data: { walletBalance: { increment: item.amountKobo } },
      });

      // Log the wallet transaction
      await tx.walletTransaction.create({
        data: {
          txnRef: `WAL-PT-${Date.now()}`,
          clientId: item.clientId,
          type: 'PRE_TERMINATION_PAYOUT',
          status: 'SUCCESSFUL',
          amountKobo: item.amountKobo,
          description: 'Pre-Termination Payout — Net of Early Exit Penalty',
          processedAt: new Date(),
          initiatedById: adminId,
        },
      });

      // Record penalty as org income in OrgLedger (only if penalty > 0)
      if (item.penaltyKobo && item.penaltyKobo > BigInt(0)) {
        await tx.orgLedger.create({
          data: {
            entryRef: `ORG-PEN-${Date.now()}`,
            type: 'EARLY_EXIT_PENALTY',
            description: `Early exit penalty income — Pre-termination`,
            amountKobo: item.penaltyKobo,
            clientId: item.clientId,
            preTermId: item.preTermId ?? undefined,
            fqItemId: id,
            recordedById: adminId,
          },
        });
      }

      // Update pre-termination and write investment history entry
      if (item.preTermId && item.preTermination?.investment) {
        await tx.preTermination.update({
          where: { id: item.preTermId },
          data: { status: 'DISBURSED', financeApprovedById: adminId, financeApprovedAt: new Date(), disbursedAt: new Date() },
        });
        await tx.investmentEvent.create({
          data: {
            investmentId: item.preTermination.investment.id,
            action: 'Pre-Termination Disbursed — Net payout credited to wallet',
            performedById: adminId,
          },
        });
      } else if (item.preTermId) {
        await tx.preTermination.update({
          where: { id: item.preTermId },
          data: { status: 'DISBURSED', financeApprovedById: adminId, financeApprovedAt: new Date(), disbursedAt: new Date() },
        });
      }

      return updated;
    });
  }

  findAllOrgLedger(query: { type?: string } = {}) {
    return this.prisma.orgLedger.findMany({
      where: query.type ? { type: query.type } : undefined,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reject(id: string, adminId: string, reason: string) {
    const item = await this.prisma.financeQueueItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Finance queue item not found');

    return this.prisma.financeQueueItem.update({
      where: { id },
      data: { status: 'REJECTED', rejectedById: adminId, rejectedAt: new Date(), rejectionReason: reason },
    });
  }
}
