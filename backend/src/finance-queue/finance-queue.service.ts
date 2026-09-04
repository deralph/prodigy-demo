import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FinanceQueueService {
  private readonly logger = new Logger(FinanceQueueService.name);
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

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

  async approve(id: string, adminId: string, notes?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const item = await this.prisma.financeQueueItem.findUnique({
      where: { id },
      include: { preTermination: { include: { investment: true } } },
    });
    if (!item) throw new NotFoundException('Finance queue item not found');
    if (item.status !== 'PENDING') throw new BadRequestException('Item is not in pending state');

    const result = await this.prisma.$transaction(async (tx) => {
      // Atomic claim — a concurrent second approve (or a double-click) can
      // never double-credit the wallet or double-disburse the pre-termination.
      const claimed = await tx.financeQueueItem.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', approvedById: adminId, approvedAt: new Date(), notes },
      });
      if (claimed.count === 0) {
        const current = await tx.financeQueueItem.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Finance queue item not found');
        throw new BadRequestException(`This finance queue item is already ${current.status.toLowerCase()} and cannot be approved again.`);
      }

      // Credit the client wallet with net payout
      await tx.client.update({
        where: { id: item.clientId },
        data: { walletBalance: { increment: item.amountKobo } },
      });

      // Log the wallet transaction — deterministic txnRef prevents double-credit
      await tx.walletTransaction.create({
        data: {
          txnRef: `WAL-PT-${id}`,
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
            entryRef: `ORG-PEN-${id}`,
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

      // Update pre-termination (conditionally — only a still-pending one may
      // be marked disbursed) and write investment history entry
      if (item.preTermId && item.preTermination?.investment) {
        const moved = await tx.preTermination.updateMany({
          where: { id: item.preTermId, status: 'PENDING_FINANCE' },
          data: { status: 'DISBURSED', financeApprovedById: adminId, financeApprovedAt: new Date(), disbursedAt: new Date() },
        });
        if (moved.count === 0) {
          throw new BadRequestException('The linked pre-termination is no longer pending finance approval.');
        }
        await tx.investmentEvent.create({
          data: {
            investmentId: item.preTermination.investment.id,
            action: 'Pre-Termination Disbursed — Net payout credited to wallet',
            performedById: adminId,
          },
        });
      } else if (item.preTermId) {
        const moved = await tx.preTermination.updateMany({
          where: { id: item.preTermId, status: 'PENDING_FINANCE' },
          data: { status: 'DISBURSED', financeApprovedById: adminId, financeApprovedAt: new Date(), disbursedAt: new Date() },
        });
        if (moved.count === 0) {
          throw new BadRequestException('The linked pre-termination is no longer pending finance approval.');
        }
      }

      // Client-facing ActivityLog: pre-termination disbursed
      await tx.activityLog.create({
        data: {
          clientId: item.clientId,
          action: 'PRE_TERMINATION_DISBURSED',
          description: `Early redemption disbursed — net payout of ₦${(Number(item.amountKobo) / 100).toLocaleString()} credited to wallet`,
          amountKobo: item.amountKobo,
          metadata: { financeQueueItemId: id, preTerminationId: item.preTermId, penaltyKobo: Number(item.penaltyKobo ?? 0) } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

      return tx.financeQueueItem.findUnique({ where: { id } });
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'FINANCE_QUEUE_DISBURSEMENT_APPROVED',
      targetEntity: id,
      category: 'FINANCE',
      metadata: { clientId: item.clientId, amountKobo: Number(item.amountKobo), penaltyKobo: Number(item.penaltyKobo ?? 0), notes },
    });

    const client = await this.prisma.client.findUnique({ where: { id: item.clientId } });
    if (client) {
      this.notifications.sendPreTerminationDisbursedEmail(client.email, client.name, Number(item.amountKobo) / 100).catch(() => {});
    }

    return result;
  }

  findAllOrgLedger(query: { type?: string } = {}) {
    return this.prisma.orgLedger.findMany({
      where: query.type ? { type: query.type } : undefined,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reject(id: string, adminId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const item = await this.prisma.financeQueueItem.findUnique({
      where: { id },
      include: { preTermination: { include: { investment: true } } },
    });
    if (!item) throw new NotFoundException('Finance queue item not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic claim — only the first reject wins; nothing can double-reject.
      const claimed = await tx.financeQueueItem.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'REJECTED', rejectedById: adminId, rejectedAt: new Date(), rejectionReason: reason },
      });
      if (claimed.count === 0) {
        const current = await tx.financeQueueItem.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Finance queue item not found');
        throw new BadRequestException(`This finance queue item is already ${current.status.toLowerCase()} and cannot be rejected again.`);
      }

      // P8 STRANDING FIX — when finance refuses the payout, restore the
      // investment that ops previously flagged PRE_TERMINATED back to ACTIVE.
      // Otherwise the client's principal would sit in limbo: neither invested
      // (earning) nor paid out. Conditionally — only a PRE_TERMINATED
      // investment is restored, and only if it belongs to this request.
      const investmentId = item.preTermination?.investmentId;
      if (item.preTermId && investmentId) {
        const restored = await tx.investment.updateMany({
          where: { id: investmentId, status: 'PRE_TERMINATED' },
          data: { status: 'ACTIVE' },
        });
        if (restored.count > 0) {
          // updateMany cannot perform nested writes, so the history event is
          // recorded separately (inside the same transaction).
          await tx.investmentEvent.create({
            data: {
              investmentId,
              action: 'Pre-Termination Payout Rejected — investment restored to Active',
              performedById: adminId,
            },
          });
          await tx.preTermination.update({
            where: { id: item.preTermId },
            data: { rejectionReason: reason, rejectedById: adminId, rejectedAt: new Date() },
          });
        } else {
          await tx.preTermination.update({
            where: { id: item.preTermId },
            data: { status: 'REJECTED', rejectionReason: reason, rejectedById: adminId, rejectedAt: new Date() },
          });
        }
      }

      // Client-facing ActivityLog: pre-termination payout rejected
      await tx.activityLog.create({
        data: {
          clientId: item.clientId,
          action: 'PRE_TERMINATION_DISBURSEMENT_REJECTED',
          description: `Early redemption payout rejected — investment${item.preTermination?.investmentId ? ' restored to active' : ''}`,
          amountKobo: item.amountKobo,
          metadata: { financeQueueItemId: id, preTerminationId: item.preTermId, reason, investmentRestored: !!item.preTermination?.investmentId } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

      return tx.financeQueueItem.findUnique({ where: { id } });
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'FINANCE_QUEUE_DISBURSEMENT_REJECTED',
      targetEntity: id,
      category: 'FINANCE',
      metadata: { clientId: item.clientId, amountKobo: Number(item.amountKobo), reason, investmentRestored: !!item.preTermination?.investmentId },
    });

    const client = await this.prisma.client.findUnique({ where: { id: item.clientId } });
    if (client) {
      this.notifications.sendPreTerminationDecisionEmail(client.email, client.name, false, undefined, reason).catch(() => {});
    }

    return updated;
  }
}
