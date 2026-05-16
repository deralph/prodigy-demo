import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceQueueService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { status?: string }) {
    return this.prisma.financeQueueItem.findMany({
      where: query.status ? { status: query.status as any } : undefined,
      include: { preTermination: { include: { investment: { include: { product: true } } } } },
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
    const item = await this.prisma.financeQueueItem.findUnique({ where: { id } });
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
          description: 'Pre-Termination Payout',
          processedAt: new Date(),
          initiatedById: adminId,
        },
      });

      // Update pre-termination if linked
      if (item.preTermId) {
        await tx.preTermination.update({
          where: { id: item.preTermId },
          data: { status: 'DISBURSED', financeApprovedById: adminId, financeApprovedAt: new Date(), disbursedAt: new Date() },
        });
      }

      return updated;
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
