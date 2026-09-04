import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { logAdminAction } from '../common/audit/log-admin-action';

@Injectable()
export class WithholdingTaxService {
  private readonly logger = new Logger(WithholdingTaxService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Calculate withholding tax on interest income.
   * Returns gross interest, tax amount, and net interest.
   */
  calculateWithholdingTax(principalKobo: bigint, roiRate: number, taxRate: number, days: number): {
    grossInterestKobo: bigint;
    taxKobo: bigint;
    netInterestKobo: bigint;
  } {
    // Simple interest: P × r × t / 365
    const grossInterestKobo = BigInt(Math.round(Number(principalKobo) * roiRate / 100 * days / 365));
    const taxKobo = BigInt(Math.round(Number(grossInterestKobo) * taxRate / 100));
    const netInterestKobo = grossInterestKobo - taxKobo;

    return { grossInterestKobo, taxKobo, netInterestKobo };
  }

  /**
   * Process withholding tax on investment maturity.
   * Creates a WithholdingTax record and OrgLedger entry for the tax collected.
   */
  async processMaturityWithholdingTax(
    investmentId: string,
    adminId?: string,
    admin?: { adminUserId?: string | null; adminRole?: string | null },
  ): Promise<{ taxKobo: bigint; netInterestKobo: bigint }> {
    const inv = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: { product: true, client: true },
    });
    if (!inv) throw new Error(`Investment ${investmentId} not found`);

    const { grossInterestKobo, taxKobo, netInterestKobo } = this.calculateWithholdingTax(
      inv.principalKobo,
      Number(inv.roiRate),
      Number(inv.taxRate),
      inv.tenorDays,
    );

    const wtRef = `WT-${inv.investRef}-${Date.now()}`;

    await this.prisma.$transaction(async (tx) => {
      // Record withholding tax collected
      await tx.withholdingTax.create({
        data: {
          wtRef,
          investmentId: inv.id,
          clientId: inv.clientId,
          grossInterestKobo,
          taxKobo,
          netInterestKobo,
          taxRate: inv.taxRate,
          status: 'COLLECTED',
          collectedAt: new Date(),
          collectedById: adminId || 'system',
        },
      });

      // Org ledger entry for withholding tax collected (org income)
      await tx.orgLedger.create({
        data: {
          entryRef: `ORG-WHT-${wtRef}`,
          type: 'WITHHOLDING_TAX_COLLECTED',
          description: `Withholding tax on maturity: ${inv.investRef} (${inv.product?.name})`,
          amountKobo: taxKobo,
          clientId: inv.clientId,
          recordedById: adminId || 'system',
        },
      });

      // Update investment with tax info
      await tx.investment.update({
        where: { id: inv.id },
        data: {
          withholdingTaxKobo: taxKobo,
          netInterestPaidKobo: netInterestKobo,
        },
      });

      // Activity log for client
      await tx.activityLog.create({
        data: {
          clientId: inv.clientId,
          action: 'WITHHOLDING_TAX_DEDUCTED',
          description: `Withholding tax deducted on maturity: ${inv.investRef} — Tax: ₦${(Number(taxKobo) / 100).toLocaleString()}, Net Interest: ₦${(Number(netInterestKobo) / 100).toLocaleString()}`,
          amountKobo: taxKobo,
          metadata: { investmentId: inv.id, wtRef, taxKobo: Number(taxKobo), netInterestKobo: Number(netInterestKobo) } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
    });

    // Audit log
    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId ?? adminId,
      adminRole: admin?.adminRole ?? 'system',
      action: 'WITHHOLDING_TAX_MATURITY_PROCESSED',
      targetEntity: investmentId,
      category: 'FINANCE',
      metadata: { investmentId, wtRef: `WT-${investmentId}-${Date.now()}`, taxKobo: Number(taxKobo), netInterestKobo: Number(netInterestKobo) },
    });

    // Notify client
    if (inv.client?.email) {
      this.notifications.sendEmail(
        inv.client.email,
        'Withholding Tax Deducted — Investment Maturity',
        `<p>Dear ${inv.client.name},</p>
         <p>Withholding tax has been deducted on the maturity of your investment <strong>${inv.investRef}</strong> (${inv.product?.name}).</p>
         <p><strong>Gross Interest:</strong> ₦${(Number(this.calculateWithholdingTax(inv.principalKobo, Number(inv.roiRate), Number(inv.taxRate), inv.tenorDays).grossInterestKobo) / 100).toLocaleString()}</p>
         <p><strong>Withholding Tax (${inv.taxRate}%):</strong> ₦${(Number(this.calculateWithholdingTax(inv.principalKobo, Number(inv.roiRate), Number(inv.taxRate), inv.tenorDays).taxKobo) / 100).toLocaleString()}</p>
         <p><strong>Net Interest:</strong> ₦${(Number(this.calculateWithholdingTax(inv.principalKobo, Number(inv.roiRate), Number(inv.taxRate), inv.tenorDays).netInterestKobo) / 100).toLocaleString()}</p>
         <p>The net amount has been credited to your wallet.</p>`,
      ).catch(() => {});
    }

    return { taxKobo, netInterestKobo };
  }

  /**
   * Process withholding tax on interest redemption (between maturity periods).
   */
  async processInterestRedemptionWithholdingTax(
    investmentId: string,
    daysSinceLastRedemption: number,
    adminId?: string,
    admin?: { adminUserId?: string | null; adminRole?: string | null },
  ): Promise<{ taxKobo: bigint; netInterestKobo: bigint }> {
    const inv = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: { product: true, client: true },
    });
    if (!inv) throw new Error(`Investment ${investmentId} not found`);

    const { grossInterestKobo, taxKobo, netInterestKobo } = this.calculateWithholdingTax(
      inv.principalKobo,
      Number(inv.roiRate),
      Number(inv.taxRate),
      daysSinceLastRedemption,
    );

    const wtRef = `WT-INT-${inv.investRef}-${Date.now()}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.withholdingTax.create({
        data: {
          wtRef,
          investmentId: inv.id,
          clientId: inv.clientId,
          grossInterestKobo,
          taxKobo,
          netInterestKobo,
          taxRate: inv.taxRate,
          status: 'COLLECTED',
          collectedAt: new Date(),
          collectedById: adminId || 'system',
        },
      });

      await tx.orgLedger.create({
        data: {
          entryRef: `ORG-WHT-INT-${wtRef}`,
          type: 'WITHHOLDING_TAX_COLLECTED',
          description: `Withholding tax on interest redemption: ${inv.investRef} (${inv.product?.name})`,
          amountKobo: taxKobo,
          clientId: inv.clientId,
          recordedById: adminId || 'system',
        },
      });

      await tx.investment.update({
        where: { id: inv.id },
        data: {
          withholdingTaxKobo: { increment: taxKobo },
          interestRedeemedKobo: { increment: netInterestKobo },
        },
      });

      await tx.activityLog.create({
        data: {
          clientId: inv.clientId,
          action: 'WITHHOLDING_TAX_INTEREST_REDEMPTION',
          description: `Withholding tax on interest redemption: ${inv.investRef} — Tax: ₦${(Number(taxKobo) / 100).toLocaleString()}`,
          amountKobo: taxKobo,
          metadata: { investmentId: inv.id, wtRef, taxKobo: Number(taxKobo), netInterestKobo: Number(netInterestKobo) } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId ?? adminId,
      adminRole: admin?.adminRole ?? 'system',
      action: 'WITHHOLDING_TAX_INTEREST_REDEMPTION_PROCESSED',
      targetEntity: investmentId,
      category: 'FINANCE',
      metadata: { taxKobo: Number(taxKobo), netInterestKobo: Number(netInterestKobo) },
    });

    return { taxKobo, netInterestKobo };
  }

  /**
   * Get withholding tax history for a client or investment.
   */
  async getWithholdingTaxHistory(query: { clientId?: string; investmentId?: string; status?: string }) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.investmentId) where.investmentId = query.investmentId;
    if (query.status) where.status = query.status as any;

    return this.prisma.withholdingTax.findMany({
      where,
      include: { investment: { include: { product: true } }, client: true },
      orderBy: { collectedAt: 'desc' },
    });
  }

  /**
   * Get withholding tax summary for admin reporting.
   */
  async getWithholdingTaxSummary(dateFrom?: Date, dateTo?: Date) {
    const where: any = { status: 'COLLECTED' };
    if (dateFrom || dateTo) {
      where.collectedAt = {};
      if (dateFrom) where.collectedAt.gte = dateFrom;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.collectedAt.lte = to;
      }
    }

    const records = await this.prisma.withholdingTax.findMany({
      where,
      select: { taxKobo: true, collectedAt: true, clientId: true },
    });

    const totalTax = records.reduce((sum, r) => sum + Number(r.taxKobo), 0);
    const byMonth = records.reduce((acc, r) => {
      const key = r.collectedAt ? new Date(r.collectedAt).toISOString().slice(0, 7) : 'unknown'; // YYYY-MM
      acc[key] = (acc[key] || 0) + Number(r.taxKobo);
      return acc;
    }, {} as Record<string, number>);

    return { totalTaxKobo: BigInt(totalTax), count: records.length, byMonth };
  }
}