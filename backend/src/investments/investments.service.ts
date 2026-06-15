import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from 'date-fns';

const PENALTY_RATE = 0.1; // 10% default early exit penalty on principal

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  // Client: get own investments
  async getMyInvestments(clientDbId: string) {
    return this.prisma.investment.findMany({
      where: { clientId: clientDbId },
      include: { product: true, history: true, preTermination: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Client: subscribe to a product
  async subscribe(clientDbId: string, dto: {
    productId: string;
    // Accept either principalKobo (bigint) or amount (Naira, from frontend)
    principalKobo?: bigint;
    amount?: number;
    tenorDays?: number;
    tenor?: string;          // e.g. "3 months" from frontend
    valueDate?: Date | string;
    autoRollover?: boolean;
    notes?: string;
  }) {
    // Normalise amount → kobo
    const principalKobo: bigint = dto.principalKobo != null
      ? BigInt(dto.principalKobo)
      : BigInt(Math.round((dto.amount ?? 0) * 100));

    // Normalise tenorDays
    const tenorDays: number = dto.tenorDays ?? this.parseTenorDays(dto.tenor) ?? 30;

    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');
    console.log(client)
    if (client.status !== 'ACTIVE') throw new ForbiddenException('Account must be active to invest. Please complete KYC.');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ACTIVE') throw new BadRequestException('Product is not currently available');
    if (principalKobo < product.minInvestKobo) {
      throw new BadRequestException(`Minimum investment is ₦${Number(product.minInvestKobo) / 100}`);
    }

    // ── Wallet balance check ────────────────────────────────────────────────
    if (client.walletBalance < principalKobo) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ₦${Number(client.walletBalance) / 100}. Required: ₦${Number(principalKobo) / 100}.`,
      );
    }

    const investRef = await this.generateInvestRef();

    // ── Atomic: deduct wallet + create subscription txn + create investment + approval ─
    return this.prisma.$transaction(async (tx) => {
      // Deduct from wallet; move to pendingBalance until admin approves
      await tx.client.update({
        where: { id: clientDbId },
        data: {
          walletBalance: { decrement: principalKobo },
          pendingBalance: { increment: principalKobo },
        },
      });

      // Record the subscription as a wallet transaction (PENDING until approved)
      await tx.walletTransaction.create({
        data: {
          txnRef: `WAL-SUB-${Date.now()}`,
          clientId: clientDbId,
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          amountKobo: principalKobo,
          description: `Investment subscription: ${product.name}`,
        },
      });

      const investment = await tx.investment.create({
        data: {
          investRef,
          clientId: clientDbId,
          productId: dto.productId,
          status: 'PENDING_APPROVAL',
          principalKobo,
          roiRate: product.roiMin,
          taxRate: (product as any).withholdingTaxRate ?? 10,
          tenorDays,
          autoRollover: dto.autoRollover ?? false,
          notes: dto.notes,
          history: {
            create: { action: 'Subscription Submitted', note: 'Awaiting ops approval' },
          },
        },
        include: { product: true },
      });

      // Create approval record so admin sees it in Approval Hub
      await tx.approval.create({
        data: {
          approvalRef: `APR-SUB-${Date.now()}`,
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          clientId: clientDbId,
          investmentId: investment.id,
          productId: dto.productId,
          amountKobo: principalKobo,
          details: {
            productName: product.name,
            tenorDays,
            investRef,
            roiRate: Number(product.roiMin),
          },
        },
      });

      return investment;
    });
  }

  private parseTenorDays(tenor?: string): number | null {
    if (!tenor) return null;
    const n = parseFloat(tenor);
    const s = tenor.toLowerCase();
    if (s.includes('year'))  return Math.round(n * 365);
    if (s.includes('month')) return Math.round(n * 30);
    if (s.includes('week'))  return Math.round(n * 7);
    if (s.includes('day'))   return Math.round(n);
    return isNaN(n) ? null : Math.round(n);
  }

  // Client: request redemption (creates pre-termination)
  async requestRedemption(clientDbId: string, investmentId: string, reason?: string) {
    const inv = await this.prisma.investment.findFirst({
      where: { id: investmentId, clientId: clientDbId, status: 'ACTIVE' },
      include: { product: true },
    });
    if (!inv) throw new NotFoundException('Active investment not found');

    const existing = await this.prisma.preTermination.findUnique({ where: { investmentId } });
    if (existing) {
      const statusLabel = existing.status === 'PENDING_OPS' ? 'pending review'
        : existing.status === 'PENDING_FINANCE' ? 'sent to finance for disbursement'
        : existing.status === 'DISBURSED' ? 'already disbursed'
        : existing.status.toLowerCase().replace('_', ' ');
      throw new BadRequestException(`A pre-termination request for this investment is already ${statusLabel}.`);
    }

    // Calculate penalty upfront so admin sees real figures during review
    const penaltyRate = inv.product?.earlyExitPenalty
      ? Number(inv.product.earlyExitPenalty) / 100
      : PENALTY_RATE;
    const principalNum = Number(inv.principalKobo);
    const penaltyKobo = BigInt(Math.round(principalNum * penaltyRate));
    const netPayoutKobo = inv.principalKobo - penaltyKobo;

    return this.prisma.$transaction(async (tx) => {
      const preTermination = await tx.preTermination.create({
        data: {
          preTermRef: `PT-${Date.now()}`,
          investmentId,
          clientId: clientDbId,
          requestedAmountKobo: inv.principalKobo,
          penaltyKobo,
          netPayoutKobo,
          reason,
        },
      });

      await tx.investmentEvent.create({
        data: {
          investmentId,
          action: `Pre-Termination Requested — Penalty: ${Math.round(penaltyRate * 100)}% of principal`,
          note: reason || undefined,
        },
      });

      return preTermination;
    });
  }

  // Admin: book investment for client
  async adminBook(dto: {
    clientRef: string;
    productId: string;
    principalKobo: bigint;
    roiRate: number;
    tenorDays: number;
    valueDate: Date;
    autoRollover?: boolean;
    notes?: string;
  }, adminId: string) {
    const client = await this.prisma.client.findUnique({ where: { clientRef: dto.clientRef } });
    if (!client) throw new NotFoundException('Client not found');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const investRef = await this.generateInvestRef();
    const maturityDate = addDays(dto.valueDate, dto.tenorDays);

    return this.prisma.investment.create({
      data: {
        investRef,
        clientId: client.id,
        productId: dto.productId,
        status: 'ACTIVE',
        principalKobo: dto.principalKobo,
        roiRate: dto.roiRate,
        tenorDays: dto.tenorDays,
        valueDate: dto.valueDate,
        maturityDate,
        autoRollover: dto.autoRollover ?? false,
        notes: dto.notes,
        bookedById: adminId,
        bookedAt: new Date(),
        approvedById: adminId,
        approvedAt: new Date(),
        history: {
          create: { action: 'Booked by Admin', note: dto.notes, performedById: adminId },
        },
      },
      include: { product: true, client: true },
    });
  }

  // Admin: get all investments with filters
  async adminFindAll(query: { search?: string; productId?: string; status?: string; clientId?: string }) {
    return this.prisma.investment.findMany({
      where: {
        ...(query.productId && { productId: query.productId }),
        ...(query.status && { status: query.status as any }),
        ...(query.clientId && { client: { clientRef: query.clientId } }),
        ...(query.search && {
          OR: [
            { investRef: { contains: query.search, mode: 'insensitive' } },
            { client: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: { product: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatement(investmentId: string, clientDbId?: string) {
    const where = clientDbId ? { id: investmentId, clientId: clientDbId } : { id: investmentId };
    const inv = await this.prisma.investment.findFirst({
      where,
      include: { product: true, client: true, history: true },
    });
    if (!inv) throw new NotFoundException('Investment not found');
    return inv;
  }

  private async generateInvestRef(): Promise<string> {
    const count = await this.prisma.investment.count();
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }
}
