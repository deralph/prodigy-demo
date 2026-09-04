import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import { NotificationsService } from '../notifications/notifications.service';

const PENALTY_RATE = 0.1; // 10% early exit penalty

@Injectable()
export class PreTerminationService {
  private readonly logger = new Logger(PreTerminationService.name);
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

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
  async approveOps(id: string, adminId: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
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
      // Atomic claim — a double-click or concurrent approve can never create
      // two finance queue items (which finance could then double-approve and
      // double-credit).
      const claimed = await tx.preTermination.updateMany({
        where: { id, status: 'PENDING_OPS' },
        data: {
          status: 'PENDING_FINANCE',
          penaltyKobo,
          netPayoutKobo,
          opsApprovedById: adminId,
          opsApprovedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        const current = await tx.preTermination.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Pre-termination not found');
        throw new BadRequestException(`This pre-termination is already ${current.status.toLowerCase()} and cannot be approved again.`);
      }

      const preTerm = await tx.preTermination.findUnique({ where: { id } });

      // Route to Finance Queue
      await tx.financeQueueItem.create({
        data: {
          fqRef: `FQ-${id}`,
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

    // Client-facing ActivityLog: pre-termination approved by ops
    await this.prisma.activityLog.create({
      data: {
        clientId: pt.investment.clientId,
        action: 'PRE_TERMINATION_OPS_APPROVED',
        description: `Early redemption approved by operations — ${pt.investment.product?.name || 'investment'} (${pt.investment.investRef}). Awaiting finance disbursement.`,
        amountKobo: netPayoutKobo,
        metadata: { preTerminationId: id, investmentId: pt.investmentId, penaltyKobo: Number(penaltyKobo), netPayoutKobo: Number(netPayoutKobo) } as any,
      },
    }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'PRE_TERMINATION_OPS_APPROVED',
      targetEntity: id,
      category: 'OPERATIONS',
      metadata: { investmentId: pt.investmentId, penaltyKobo: Number(penaltyKobo), netPayoutKobo: Number(netPayoutKobo) },
    });

    return updated;
  }

  async rejectOps(id: string, adminId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const pt = await this.prisma.preTermination.findUnique({ where: { id } });
    if (!pt) throw new NotFoundException('Pre-termination not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic claim — only the first rejection wins.
      const claimed = await tx.preTermination.updateMany({
        where: { id, status: 'PENDING_OPS' },
        data: {
          status: 'REJECTED',
          rejectedById: adminId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });
      if (claimed.count === 0) {
        const current = await tx.preTermination.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Pre-termination not found');
        throw new BadRequestException(`This pre-termination is already ${current.status.toLowerCase()} and cannot be rejected again.`);
      }
      return tx.preTermination.findUnique({ where: { id }, include: { investment: { include: { product: true } } } });
    });

    // Client-facing ActivityLog: pre-termination rejected
    await this.prisma.activityLog.create({
      data: {
        clientId: updated!.investment.clientId,
        action: 'PRE_TERMINATION_OPS_REJECTED',
        description: `Early redemption request rejected — ${updated!.investment.product?.name || 'investment'} (${updated!.investment.investRef})`,
        amountKobo: updated!.requestedAmountKobo,
        metadata: { preTerminationId: id, investmentId: updated!.investmentId, reason } as any,
      },
    }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'PRE_TERMINATION_OPS_REJECTED',
      targetEntity: id,
      category: 'OPERATIONS',
      metadata: { investmentId: pt.investmentId, reason },
    });

    const ptWithClient = await this.prisma.preTermination.findUnique({
      where: { id }, include: { investment: { include: { client: true } } },
    });
    const client = ptWithClient?.investment?.client;
    if (client) {
      this.notifications.sendPreTerminationDecisionEmail(client.email, client.name, false, undefined, reason).catch(() => {});
    }

    return updated;
  }
}
