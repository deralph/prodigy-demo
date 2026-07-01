import { Injectable, NotFoundException } from '@nestjs/common';
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

  async approve(id: string, adminId: string, notes?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: adminId, reviewNotes: notes, reviewedAt: new Date() },
    });

    // If it's a SUBSCRIPTION approval → activate investment + settle wallet
    if (approval.type === 'SUBSCRIPTION' && approval.investmentId) {
      const inv = await this.prisma.investment.findUnique({ where: { id: approval.investmentId } });
      if (inv) {
        const valueDate = new Date();
        const maturityDate = addDays(valueDate, inv.tenorDays);
        await this.prisma.$transaction([
          // Activate investment
          this.prisma.investment.update({
            where: { id: approval.investmentId },
            data: {
              status: 'ACTIVE',
              valueDate,
              maturityDate,
              approvedById: adminId,
              approvedAt: new Date(),
              history: { create: { action: 'Approved & Activated', note: notes, performedById: adminId } },
            },
          }),
          // Remove from pendingBalance (money is now formally invested)
          this.prisma.client.update({
            where: { id: inv.clientId },
            data: { pendingBalance: { decrement: inv.principalKobo } },
          }),
          // Mark wallet txn as SUCCESSFUL
          this.prisma.walletTransaction.updateMany({
            where: { clientId: inv.clientId, type: 'SUBSCRIPTION', status: 'PENDING', amountKobo: inv.principalKobo },
            data: { status: 'SUCCESSFUL', processedAt: new Date() },
          }),
        ]);

        const client = await this.prisma.client.findUnique({ where: { id: inv.clientId } });
        const productName = (approval.details as any)?.productName || 'your product';
        if (client) {
          this.notifications.sendInvestmentActivatedEmail(
            client.email, client.name, productName, Number(inv.principalKobo) / 100, maturityDate,
          ).catch(() => {});
        }
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

    return updated;
  }

  async reject(id: string, adminId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: adminId, reviewNotes: reason, reviewedAt: new Date() },
    });

    if (approval.type === 'SUBSCRIPTION' && approval.investmentId) {
      const inv = await this.prisma.investment.findUnique({ where: { id: approval.investmentId } });
      if (inv) {
        await this.prisma.$transaction([
          // Reject investment
          this.prisma.investment.update({
            where: { id: approval.investmentId },
            data: { status: 'REJECTED', history: { create: { action: 'Rejected', note: reason, performedById: adminId } } },
          }),
          // Refund wallet balance + clear pending
          this.prisma.client.update({
            where: { id: inv.clientId },
            data: {
              walletBalance: { increment: inv.principalKobo },
              pendingBalance: { decrement: inv.principalKobo },
            },
          }),
          // Mark wallet txn as REVERSED
          this.prisma.walletTransaction.updateMany({
            where: { clientId: inv.clientId, type: 'SUBSCRIPTION', status: 'PENDING', amountKobo: inv.principalKobo },
            data: { status: 'REVERSED', processedAt: new Date() },
          }),
        ]);

        const client = await this.prisma.client.findUnique({ where: { id: inv.clientId } });
        const productName = (approval.details as any)?.productName || 'your product';
        if (client) {
          this.notifications.sendInvestmentRejectedEmail(
            client.email, client.name, productName, Number(inv.principalKobo) / 100, reason,
          ).catch(() => {});
        }
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

    return updated;
  }
}
