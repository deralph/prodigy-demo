import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from 'date-fns';
import { logAdminAction } from '../common/audit/log-admin-action';
import { NotificationsService } from '../notifications/notifications.service';

const PENALTY_RATE = 0.1; // 10% default early exit penalty on principal

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  // Client: get own investments (excludes internal investments)
  async getMyInvestments(clientDbId: string) {
    return this.prisma.investment.findMany({
      where: { clientId: clientDbId, isInternal: false },
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
    notes?: string;
  }) {
    // Normalise amount → kobo
    const principalKobo: bigint = dto.principalKobo != null
      ? BigInt(dto.principalKobo)
      : BigInt(Math.round((dto.amount ?? 0) * 100));

    // A zero or negative principal must never reach the wallet/ledger — it
    // would otherwise "credit" pendingBalance or bypass the min check.
    if (principalKobo <= BigInt(0)) {
      throw new BadRequestException('Investment amount must be greater than zero.');
    }

    // Normalise tenorDays
    const tenorDays: number = dto.tenorDays ?? this.parseTenorDays(dto.tenor) ?? 30;

    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.status !== 'ACTIVE') throw new ForbiddenException('Account must be active to invest. Please complete KYC.');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ACTIVE') throw new BadRequestException('Product is not currently available');
    if (principalKobo < product.minInvestKobo) {
      throw new BadRequestException(`Minimum investment is ₦${Number(product.minInvestKobo) / 100}`);
    }
    if (product.maxInvestKobo != null && principalKobo > product.maxInvestKobo) {
      throw new BadRequestException(`Maximum investment for this product is ₦${Number(product.maxInvestKobo) / 100}`);
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
      // Atomic debit — the WHERE walletBalance >= amount guard means two
      // concurrent subscriptions can never both pass the balance check and
      // overdraw the wallet (e.g. one ₦2m and one ₦3m against a ₦4m balance).
      const debited = await tx.client.updateMany({
        where: { id: clientDbId, walletBalance: { gte: principalKobo } },
        data: {
          walletBalance: { decrement: principalKobo },
          pendingBalance: { increment: principalKobo },
        },
      });
      if (debited.count === 0) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ₦${Number(client.walletBalance) / 100}. Required: ₦${Number(principalKobo) / 100}.`,
        );
      }

      // Record the subscription as a wallet transaction (PENDING until approved)
      const walletTx = await tx.walletTransaction.create({
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

      // Client-facing ActivityLog: subscription created
      await tx.activityLog.create({
        data: {
          clientId: clientDbId,
          action: 'INVESTMENT_SUBSCRIPTION_CREATED',
          description: `Investment subscription of ₦${(Number(principalKobo) / 100).toLocaleString()} to ${product.name} submitted for approval`,
          amountKobo: principalKobo,
          metadata: { investmentId: investment.id, investRef, productId: dto.productId, walletTxnRef: walletTx.txnRef } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

      return { investment, walletTx };
    }).then(async ({ investment, walletTx }) => {
      // Notify client + ops admins — never blocks the response if email fails.
      this.notifications.sendInvestmentSubmittedEmail(
        client.email, client.name, product.name, Number(principalKobo) / 100,
      ).catch(() => {});
      this.notifications.notifyAdminsByRole(
        ['SUPER_ADMIN', 'OPERATIONS'],
        'New Investment Subscription Pending Approval',
        `<p>${client.name} (${client.clientRef}) has subscribed to <strong>${product.name}</strong> for ₦${(Number(principalKobo) / 100).toLocaleString()}. It is awaiting approval in the Approval Hub.</p>`,
      ).catch(() => {});
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

      // Client-facing ActivityLog: pre-termination requested
      await tx.activityLog.create({
        data: {
          clientId: clientDbId,
          action: 'PRE_TERMINATION_REQUESTED',
          description: `Early redemption requested for ${inv.product?.name || 'investment'} (${inv.investRef}) — net payout: ₦${(Number(netPayoutKobo) / 100).toLocaleString()} after ₦${(Number(penaltyKobo) / 100).toLocaleString()} penalty`,
          amountKobo: netPayoutKobo,
          metadata: { investmentId, preTerminationId: preTermination.id, penaltyKobo: Number(penaltyKobo), netPayoutKobo: Number(netPayoutKobo), reason } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

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
    notes?: string;
    isInternal?: boolean;
  }, adminId: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const client = await this.prisma.client.findUnique({ where: { clientRef: dto.clientRef } });
    if (!client) throw new NotFoundException('Client not found');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.principalKobo <= BigInt(0)) {
      throw new BadRequestException('Investment amount must be greater than zero.');
    }
    if (dto.principalKobo < product.minInvestKobo) {
      throw new BadRequestException(`Minimum investment for this product is ₦${Number(product.minInvestKobo) / 100}`);
    }
    if (product.maxInvestKobo != null && dto.principalKobo > product.maxInvestKobo) {
      throw new BadRequestException(`Maximum investment for this product is ₦${Number(product.maxInvestKobo) / 100}`);
    }

    const investRef = await this.generateInvestRef();
    const maturityDate = addDays(dto.valueDate, dto.tenorDays);

    const investment = await this.prisma.investment.create({
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
        notes: dto.notes,
        isInternal: dto.isInternal ?? false,
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

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'INVESTMENT_BOOKED_BY_ADMIN',
      targetEntity: investment.id,
      category: 'INVESTMENT',
      metadata: {
        clientRef: dto.clientRef,
        productName: product.name,
        principalKobo: Number(dto.principalKobo),
        roiRate: dto.roiRate,
        tenorDays: dto.tenorDays,
      },
    });

    this.notifications.sendInvestmentActivatedEmail(
      client.email, client.name, product.name, Number(dto.principalKobo) / 100, maturityDate,
    ).catch(() => {});

    return investment;
  }

  // Admin: get all investments with filters
  async adminFindAll(query: { search?: string; productId?: string; status?: string; clientId?: string; isInternal?: boolean }) {
    return this.prisma.investment.findMany({
      where: {
        ...(query.productId && { productId: query.productId }),
        ...(query.status && { status: query.status as any }),
        ...(query.clientId && { client: { clientRef: query.clientId } }),
        ...(query.isInternal !== undefined && { isInternal: query.isInternal }),
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

  // ════════════════════════════════════════════════════════════════════
  // INVESTMENT LIFECYCLE & CALCULATIONS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Get detailed investment calculation breakdown.
   * Returns principal, interest, tax, maturity, payout, outstanding.
   */
  async getInvestmentCalculationDetails(investmentId: string, clientDbId?: string) {
    const where = clientDbId ? { id: investmentId, clientId: clientDbId } : { id: investmentId };
    const inv = await this.prisma.investment.findFirst({
      where,
      include: { product: true, client: true, history: true, preTermination: true },
    });
    if (!inv) throw new NotFoundException('Investment not found');

    const principalNaira = Number(inv.principalKobo) / 100;
    const roiRate = Number(inv.roiRate);
    const taxRate = Number(inv.taxRate);
    const tenorDays = inv.tenorDays;
    const valueDate = inv.valueDate ? new Date(inv.valueDate) : null;
    const maturityDate = inv.maturityDate ? new Date(inv.maturityDate) : null;

    // Calculate expected interest (simple interest: P * r * t / 365)
    const expectedInterestKobo = BigInt(Math.round(Number(inv.principalKobo) * roiRate / 100 * tenorDays / 365));
    const expectedTaxKobo = BigInt(Math.round(Number(expectedInterestKobo) * taxRate / 100));
    const expectedNetInterestKobo = expectedInterestKobo - expectedTaxKobo;
    const expectedPayoutKobo = inv.principalKobo + expectedNetInterestKobo;

    // Check if matured
    const isMatured = maturityDate && maturityDate <= new Date();
    const daysToMaturity = maturityDate ? Math.max(0, Math.ceil((maturityDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;

    // Check for pre-termination
    const hasPreTermination = !!inv.preTermination;
    const preTerminationStatus = inv.preTermination?.status || null;

    return {
      investmentId: inv.id,
      investRef: inv.investRef,
      clientId: inv.clientId,
      product: inv.product,
      // Principal
      principalNaira,
      principalKobo: inv.principalKobo,
      // Rates
      roiRate,
      taxRate,
      // Tenor
      tenorDays,
      tenorDisplay: this.formatTenorDays(tenorDays),
      // Dates
      valueDate: valueDate?.toISOString().split('T')[0] || null,
      maturityDate: maturityDate?.toISOString().split('T')[0] || null,
      daysToMaturity,
      isMatured,
      // Calculations
      expectedInterestNaira: Number(expectedInterestKobo) / 100,
      expectedTaxNaira: Number(expectedTaxKobo) / 100,
      expectedNetInterestNaira: Number(expectedNetInterestKobo) / 100,
      expectedPayoutNaira: Number(expectedPayoutKobo) / 100,
      // Status
      status: inv.status,
      hasPreTermination,
      preTerminationStatus,
      // Pre-termination details
      preTermination: inv.preTermination ? {
        preTermRef: inv.preTermination.preTermRef,
        status: inv.preTermination.status,
        requestedAmountKobo: inv.preTermination.requestedAmountKobo,
        penaltyKobo: inv.preTermination.penaltyKobo,
        netPayoutKobo: inv.preTermination.netPayoutKobo,
        requestedAt: inv.preTermination.requestedAt,
      } : null,
      // History
      history: inv.history.map(h => ({
        action: h.action,
        note: h.note,
        performedById: h.performedById,
        occurredAt: h.occurredAt,
      })),
    };
  }

  private formatTenorDays(days: number): string {
    if (days % 365 === 0) return `${days / 365} year${days / 365 === 1 ? '' : 's'}`;
    if (days % 30 === 0) return `${days / 30} month${days / 30 === 1 ? '' : 's'}`;
    if (days % 7 === 0) return `${days / 7} week${days / 7 === 1 ? '' : 's'}`;
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  /**
   * Get investment detail with related transactions.
   */
  async getInvestmentDetail(investmentId: string, clientDbId?: string) {
    const where = clientDbId ? { id: investmentId, clientId: clientDbId } : { id: investmentId };
    const inv = await this.prisma.investment.findFirst({
      where,
      include: {
        product: true,
        client: { select: { id: true, clientRef: true, name: true, email: true } },
        history: true,
        preTermination: true,
        walletTransactions: { orderBy: { createdAt: 'desc' } },
        dividendEntries: { include: { dividend: true } },
      },
    });
    if (!inv) throw new NotFoundException('Investment not found');

    const calculation = await this.getInvestmentCalculationDetails(investmentId, clientDbId);
    return { investment: inv, calculation };
  }

  /**
   * Process investment maturity — called by cron job.
   * Marks ACTIVE investments as MATURED when maturity date reached.
   * Idempotent: uses atomic claim (updateMany with status=ACTIVE guard) so
   * concurrent/duplicate runs cannot double-payout the same investment.
   */
  async processMaturity(adminId?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const now = new Date();
    const maturedInvestments = await this.prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        maturityDate: { lte: now },
        isInternal: false, // Only process client investments for maturity payout
      },
      include: { product: true, client: true },
    });

    const results: Array<{ investRef: string; payoutKobo: bigint }> = [];
    for (const inv of maturedInvestments) {
      // Atomic claim: only the first concurrent call wins the status transition
      const claimed = await this.prisma.investment.updateMany({
        where: { id: inv.id, status: 'ACTIVE', maturityDate: { lte: now } },
        data: { status: 'MATURED' },
      });
      if (claimed.count === 0) {
        // Another process already claimed this investment (or it's no longer ACTIVE/matured)
        this.logger.log(`Maturity processing skipped for ${inv.investRef} — already claimed or not eligible`);
        continue;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Calculate actual interest and payout
        const principalNaira = Number(inv.principalKobo) / 100;
        const roiRate = Number(inv.roiRate);
        const taxRate = Number(inv.taxRate);
        const tenorDays = inv.tenorDays;

        const interestKobo = BigInt(Math.round(Number(inv.principalKobo) * roiRate / 100 * tenorDays / 365));
        const taxKobo = BigInt(Math.round(Number(interestKobo) * taxRate / 100));
        const netInterestKobo = interestKobo - taxKobo;
        const payoutKobo = inv.principalKobo + netInterestKobo;

        // Create wallet transaction for payout (idempotent via unique txnRef pattern)
        await tx.walletTransaction.create({
          data: {
            txnRef: `WAL-MAT-${inv.id.slice(-8)}-${Date.now()}`,
            clientId: inv.clientId,
            type: 'REDEMPTION',
            status: 'SUCCESSFUL',
            amountKobo: payoutKobo,
            approvedAmountKobo: payoutKobo,
            disbursedAmountKobo: payoutKobo,
            description: `Maturity payout: ${inv.investRef} (${inv.product?.name}) — Principal: ₦${principalNaira.toLocaleString()}, Net Interest: ₦${(Number(netInterestKobo) / 100).toLocaleString()}`,
            processedAt: now,
            initiatedById: adminId || 'system',
            approvedById: adminId || 'system',
            approvedAt: now,
          },
        });

        // Credit wallet balance
        await tx.client.update({
          where: { id: inv.clientId },
          data: { walletBalance: { increment: payoutKobo } },
        });

        // Add maturity history entry
        await tx.investmentEvent.create({
          data: {
            investmentId: inv.id,
            action: `Matured on ${now.toISOString().split('T')[0]}`,
            performedById: adminId || 'system',
          },
        });

        return { payoutKobo, interestKobo, taxKobo, netInterestKobo };
      });

      // Activity log
      await this.prisma.activityLog.create({
        data: {
          clientId: inv.clientId,
          action: 'INVESTMENT_MATURED',
          description: `Investment ${inv.investRef} (${inv.product?.name}) matured. Payout: ₦${(Number(result.payoutKobo) / 100).toLocaleString()}`,
          amountKobo: result.payoutKobo,
          metadata: { investmentId: inv.id, investRef: inv.investRef, payoutKobo: Number(result.payoutKobo), interestKobo: Number(result.interestKobo), taxKobo: Number(result.taxKobo) } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

      // Audit log
      await logAdminAction(this.prisma, {
        adminId: admin?.adminUserId ?? adminId,
        adminRole: admin?.adminRole ?? 'system',
        action: 'INVESTMENT_MATURED',
        targetEntity: inv.id,
        category: 'INVESTMENT',
        metadata: { investRef: inv.investRef, productName: inv.product?.name, payoutKobo: Number(result.payoutKobo), interestKobo: Number(result.interestKobo), taxKobo: Number(result.taxKobo) },
      });

      results.push({ investRef: inv.investRef, payoutKobo: result.payoutKobo });
    }

    return results;
  }

  /**
   * Admin: Mark matured investment as PAID_OUT (finalize payout).
   */
  async markPaidOut(investmentId: string, adminId: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const inv = await this.prisma.investment.findUnique({ where: { id: investmentId }, include: { product: true, client: true } });
    if (!inv) throw new NotFoundException('Investment not found');
    if (inv.status !== 'MATURED') throw new BadRequestException('Only MATURED investments can be marked as PAID_OUT.');

    const adminName = await this.resolveAdminName(adminId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedInv = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: 'PAID_OUT',
          history: { create: { action: 'Marked Paid Out', note: 'Payout finalized by admin', performedById: adminId } },
        },
      });

      // Activity log
      if (inv.clientId) {
        await tx.activityLog.create({
          data: {
            clientId: inv.clientId,
            action: 'INVESTMENT_PAID_OUT',
            description: `Investment ${inv.investRef} payout finalized`,
            amountKobo: BigInt(0),
            metadata: { investmentId: inv.id, investRef: inv.investRef } as any,
          },
        }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
      }

      return updatedInv;
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'INVESTMENT_PAID_OUT',
      targetEntity: investmentId,
      category: 'INVESTMENT',
      metadata: { investRef: inv.investRef, productName: inv.product?.name },
    });

    return updated;
  }

  /**
   * Admin: Close an investment (ACTIVE or MATURED → CLOSED).
   * This is for administrative closure, not normal maturity.
   */
  async closeInvestment(investmentId: string, adminId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const inv = await this.prisma.investment.findUnique({ where: { id: investmentId }, include: { product: true, client: true } });
    if (!inv) throw new NotFoundException('Investment not found');
    if (!['ACTIVE', 'MATURED'].includes(inv.status)) throw new BadRequestException(`Cannot close investment with status ${inv.status}.`);

    const adminName = await this.resolveAdminName(adminId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedInv = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: 'CLOSED',
          history: { create: { action: 'Closed', note: reason, performedById: adminId } },
        },
      });

      // Activity log
      if (inv.clientId) {
        await tx.activityLog.create({
          data: {
            clientId: inv.clientId,
            action: 'INVESTMENT_CLOSED',
            description: `Investment ${inv.investRef} closed by admin: ${reason}`,
            amountKobo: BigInt(0),
            metadata: { investmentId: inv.id, investRef: inv.investRef, reason } as any,
          },
        }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
      }

      return updatedInv;
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'INVESTMENT_CLOSED',
      targetEntity: investmentId,
      category: 'INVESTMENT',
      metadata: { investRef: inv.investRef, productName: inv.product?.name, reason },
    });

    return updated;
  }

  /**
   * Client: redeem accrued interest into wallet balance.
   * First-time redemption requires KYC Level 3 (APPROVED status).
   * Calculates accrued interest since last redemption (or valueDate),
   * applies withholding tax, credits wallet, and updates investment.
   */
  async redeemAccruedInterest(clientDbId: string, investmentId: string) {
    const inv = await this.prisma.investment.findFirst({
      where: { id: investmentId, clientId: clientDbId },
      include: { product: true, client: { include: { kycRecord: true } } },
    });
    if (!inv) throw new NotFoundException('Investment not found');
    if (inv.isInternal) throw new BadRequestException('Internal investments cannot redeem interest.');
    if (inv.status !== 'ACTIVE' && inv.status !== 'MATURED') {
      throw new BadRequestException(`Cannot redeem interest for investment with status ${inv.status}.`);
    }

    // Check KYC Level 3 (APPROVED) for first-time redemption
    const isFirstRedemption = inv.interestRedeemedKobo === BigInt(0);
    const kycApproved = inv.client?.kycRecord?.status === 'APPROVED';
    if (isFirstRedemption && !kycApproved) {
      throw new BadRequestException(
        'Withdrawal not permitted. Complete your KYC level for withdrawal.',
      );
    }

    // Calculate accrued interest since last redemption (or valueDate)
    const now = new Date();
    const lastRedeemedAt = inv.interestRedeemedKobo > BigInt(0)
      ? new Date(inv.updatedAt) // approximate: last update when interest was redeemed
      : inv.valueDate || inv.createdAt;
    const daysSinceLastRedemption = Math.max(0, Math.floor((now.getTime() - new Date(lastRedeemedAt).getTime()) / (1000 * 60 * 60 * 24)));

    if (daysSinceLastRedemption <= 0) {
      throw new BadRequestException('No accrued interest available for redemption yet.');
    }

    const principalNaira = Number(inv.principalKobo) / 100;
    const roiRate = Number(inv.roiRate);
    const taxRate = Number(inv.taxRate);

    // Simple interest for the period since last redemption
    const accruedInterestKobo = BigInt(Math.round(Number(inv.principalKobo) * roiRate / 100 * daysSinceLastRedemption / 365));
    const taxKobo = BigInt(Math.round(Number(accruedInterestKobo) * taxRate / 100));
    const netInterestKobo = accruedInterestKobo - taxKobo;

    if (netInterestKobo <= BigInt(0)) {
      throw new BadRequestException('No net interest available for redemption after tax.');
    }

    const totalRedeemedAfter = inv.interestRedeemedKobo + netInterestKobo;

    // Prevent over-redemption (should not exceed total expected interest for tenor)
    const maxTotalInterestKobo = BigInt(Math.round(Number(inv.principalKobo) * Number(inv.roiRate) / 100 * inv.tenorDays / 365));
    if (totalRedeemedAfter > maxTotalInterestKobo) {
      throw new BadRequestException('Redemption amount exceeds maximum expected interest for this investment.');
    }

    // Atomic: credit wallet + update investment + create wallet transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Credit wallet balance
      await tx.client.update({
        where: { id: inv.clientId },
        data: { walletBalance: { increment: netInterestKobo } },
      });

      // Create wallet transaction for interest redemption
      const walletTx = await tx.walletTransaction.create({
        data: {
          txnRef: `WAL-INT-${inv.id.slice(-8)}-${Date.now()}`,
          clientId: inv.clientId,
          type: 'INTEREST',
          status: 'SUCCESSFUL',
          amountKobo: netInterestKobo,
          approvedAmountKobo: netInterestKobo,
          disbursedAmountKobo: netInterestKobo,
          description: `Accrued interest redemption: ${inv.investRef} (${inv.product?.name}) — Gross: ₦${(Number(accruedInterestKobo) / 100).toLocaleString()}, Tax: ₦${(Number(accruedInterestKobo) - Number(netInterestKobo)) / 100} ₦, Net: ₦${(Number(netInterestKobo) / 100).toLocaleString()}`,
          processedAt: new Date(),
          initiatedById: 'system',
          approvedById: 'system',
          approvedAt: new Date(),
          metadata: { investmentId: inv.id, accruedInterestKobo: Number(accruedInterestKobo), taxKobo: Number(accruedInterestKobo) - Number(netInterestKobo) } as any,
        },
      });

      // Update investment: track redeemed interest
      const updatedInv = await tx.investment.update({
        where: { id: inv.id },
        data: {
          interestRedeemedKobo: totalRedeemedAfter,
          history: {
            create: {
              action: 'Interest Redeemed',
              note: `Redeemed ₦${(Number(netInterestKobo) / 100).toLocaleString()} net interest (${daysSinceLastRedemption} days accrued)`,
              performedById: 'system',
            },
          },
        },
      });

      return { investment: updatedInv, walletTx, netInterestKobo, accruedInterestKobo, taxKobo };
    });

    // Activity log
    await this.prisma.activityLog.create({
      data: {
        clientId: inv.clientId,
        action: 'INTEREST_REDEEMED',
        description: `Accrued interest redeemed for ${inv.investRef} (${inv.product?.name}): ₦${(Number(result.netInterestKobo) / 100).toLocaleString()} net (${daysSinceLastRedemption} days)`,
        amountKobo: result.netInterestKobo,
        metadata: {
          investmentId: inv.id,
          investRef: inv.investRef,
          grossInterestKobo: Number(result.accruedInterestKobo),
          taxKobo: Number(result.accruedInterestKobo) - Number(result.netInterestKobo),
          netInterestKobo: Number(result.netInterestKobo),
          daysAccrued: daysSinceLastRedemption,
        } as any,
      },
    }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

    // Audit log
    await logAdminAction(this.prisma, {
      adminId: null,
      adminRole: 'system',
      action: 'INTEREST_REDEEMED',
      targetEntity: inv.id,
      category: 'INVESTMENT',
      metadata: {
        investRef: inv.investRef,
        productName: inv.product?.name,
        grossInterestKobo: Number(result.accruedInterestKobo),
        taxKobo: Number(result.accruedInterestKobo) - Number(result.netInterestKobo),
        netInterestKobo: Number(result.netInterestKobo),
        daysAccrued: daysSinceLastRedemption,
      },
    });

    return result;
  }

  /**
   * Resolve admin name for audit/ledger.
   */
  private async resolveAdminName(adminId?: string | null): Promise<string> {
    if (!adminId) return 'Unknown Admin';
    try {
      const adminUser = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
      return adminUser?.name || 'Unknown Admin';
    } catch {
      return 'Unknown Admin';
    }
  }
}
