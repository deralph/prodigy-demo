import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

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

  async approve(id: string, adminId: string, notes?: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: adminId, reviewNotes: notes, reviewedAt: new Date() },
    });

    // If it's a SUBSCRIPTION approval → activate investment
    if (approval.type === 'SUBSCRIPTION' && approval.investmentId) {
      await this.prisma.investment.update({
        where: { id: approval.investmentId },
        data: {
          status: 'ACTIVE',
          approvedById: adminId,
          approvedAt: new Date(),
          history: { create: { action: 'Approved & Activated', performedById: adminId } },
        },
      });
    }

    return updated;
  }

  async reject(id: string, adminId: string, reason: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: adminId, reviewNotes: reason, reviewedAt: new Date() },
    });

    if (approval.type === 'SUBSCRIPTION' && approval.investmentId) {
      await this.prisma.investment.update({
        where: { id: approval.investmentId },
        data: { status: 'REJECTED', history: { create: { action: 'Rejected', note: reason, performedById: adminId } } },
      });
    }

    return updated;
  }
}
