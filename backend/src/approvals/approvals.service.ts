import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from 'date-fns';
import { logAdminAction } from '../common/audit/log-admin-action';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  findAll(query: { status?: string; type?: string }) {
    return this.prisma.approval.findMany({
      where: {
        ...(query.status && { status: query.status as any }),
        ...(query.type && { type: query.type as any }),
      },
      include: { client: true, investment: { include: { product: true } }, product: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Approve a queued item. Atomic: the approval is claimed with a conditional
   * update (WHERE status = PENDING) inside a single transaction, so a second
   * (or concurrent) approve/reject attempt can never double-settle, double
   * clear pendingBalance, or double-refund the wallet.
   */
  async approve(id: string, adminId: string, notes?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const approval = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.approval.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedById: adminId, reviewNotes: notes, reviewedAt: new Date() },
      });
      if (claimed.count === 0) {
        const existing = await tx.approval.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Approval not found');
        throw new BadRequestException(`This approval is already ${existing.status.toLowerCase()} and cannot be approved again.`);
      }

      const current = await tx.approval.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Approval not found');

      // If it's a SUBSCRIPTION approval → activate investment + settle wallet
      if (current.type === 'SUBSCRIPTION' && current.investmentId) {
        const inv = await tx.investment.findUnique({ where: { id: current.investmentId } });
        if (inv) {
          const valueDate = new Date();
          const maturityDate = addDays(valueDate, inv.tenorDays);
          // Activate investment
          await tx.investment.update({
            where: { id: current.investmentId },
            data: {
              status: 'ACTIVE',
              valueDate,
              maturityDate,
              approvedById: adminId,
              approvedAt: new Date(),
              history: { create: { action: 'Approved & Activated', note: notes, performedById: adminId } },
            },
          });
          // Remove from pendingBalance exactly once (money is now formally invested)
          const cleared = await tx.client.updateMany({
            where: { id: inv.clientId, pendingBalance: { gte: inv.principalKobo } },
            data: { pendingBalance: { decrement: inv.principalKobo } },
          });
          if (cleared.count === 0) {
            throw new BadRequestException('Client pending balance is insufficient to settle this approval.');
          }
          // Mark wallet txn as SUCCESSFUL
          await tx.walletTransaction.updateMany({
            where: { clientId: inv.clientId, type: 'SUBSCRIPTION', status: 'PENDING', amountKobo: inv.principalKobo },
            data: { status: 'SUCCESSFUL', processedAt: new Date() },
          });
        }
      }

      return current;
    });

    if (!approval) throw new NotFoundException('Approval not found');

    const client = await this.prisma.client.findUnique({ where: { id: approval.clientId ?? '' } });
    const productName = (approval.details as any)?.productName || 'your product';
    if (approval.type === 'SUBSCRIPTION' && approval.investmentId && client) {
      const inv = await this.prisma.investment.findUnique({ where: { id: approval.investmentId } });
      if (inv) {
        const valueDate = new Date();
        const maturityDate = addDays(valueDate, inv.tenorDays);
        this.notifications.sendInvestmentActivatedEmail(
          client.email, client.name, productName, Number(inv.principalKobo) / 100, maturityDate,
        ).catch(() => {});
      }
    }

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: `APPROVAL_${approval.type}_APPROVED`,
      targetEntity: id,
      category: approval.type === 'SUBSCRIPTION' ? 'INVESTMENT' : 'OPERATIONS',
      metadata: { approvalType: approval.type, notes },
    });

    return approval;
  }

  /**
   * Reject a queued item. Atomic (same claim semantics as approve): the
   * approval status is the transition guard, so an already-processed item
   * cannot be rejected again — no double refund, no double pending clear.
   */
  async reject(id: string, adminId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const approval = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.approval.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'REJECTED', reviewedById: adminId, reviewNotes: reason, reviewedAt: new Date() },
      });
      if (claimed.count === 0) {
        const existing = await tx.approval.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Approval not found');
        throw new BadRequestException(`This approval is already ${existing.status.toLowerCase()} and cannot be rejected again.`);
      }

      const current = await tx.approval.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Approval not found');

      if (current.type === 'SUBSCRIPTION' && current.investmentId) {
        const inv = await tx.investment.findUnique({ where: { id: current.investmentId } });
        if (inv) {
          // Reject investment
          await tx.investment.update({
            where: { id: current.investmentId },
            data: { status: 'REJECTED', history: { create: { action: 'Rejected', note: reason, performedById: adminId } } },
          });
          // Refund wallet balance + clear pending exactly once
          const refunded = await tx.client.updateMany({
            where: { id: inv.clientId, pendingBalance: { gte: inv.principalKobo } },
            data: {
              walletBalance: { increment: inv.principalKobo },
              pendingBalance: { decrement: inv.principalKobo },
            },
          });
          if (refunded.count === 0) {
            throw new BadRequestException('Client pending balance is insufficient to refund this approval.');
          }
          // Mark wallet txn as REVERSED
          await tx.walletTransaction.updateMany({
            where: { clientId: inv.clientId, type: 'SUBSCRIPTION', status: 'PENDING', amountKobo: inv.principalKobo },
            data: { status: 'REVERSED', processedAt: new Date() },
          });
        }
      }

      return current;
    });

    if (!approval) throw new NotFoundException('Approval not found');

    const client = await this.prisma.client.findUnique({ where: { id: approval.clientId ?? '' } });
    const productName = (approval.details as any)?.productName || 'your product';
    if (approval.type === 'SUBSCRIPTION' && approval.investmentId && client) {
      const inv = await this.prisma.investment.findUnique({ where: { id: approval.investmentId } });
      if (inv) {
        this.notifications.sendInvestmentRejectedEmail(
          client.email, client.name, productName, Number(inv.principalKobo) / 100, reason,
        ).catch(() => {});
      }
    }

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: `APPROVAL_${approval.type}_REJECTED`,
      targetEntity: id,
      category: approval.type === 'SUBSCRIPTION' ? 'INVESTMENT' : 'OPERATIONS',
      metadata: { approvalType: approval.type, reason },
    });

    return approval;
  }
}
