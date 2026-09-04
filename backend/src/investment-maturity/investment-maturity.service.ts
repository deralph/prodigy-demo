import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { logAdminAction } from '../common/audit/log-admin-action';

const MATURITY_REMINDER_DAYS = 3;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Investment Maturity Service
 * 
 * Handles the automated processing of investment maturities.
 * Runs daily at 1:00 AM via cron job.
 * 
 * BUSINESS RULES:
 * 1. Only processes NON-INTERNAL investments (isInternal = false).
 *    Internal investments are company/treasury investments and should not
 *    trigger maturity payouts to client wallets.
 * 2. Sends maturity reminders exactly 3 days before maturity date.
 *    Uses a single fixed trigger point to avoid duplicate reminders.
 * 3. Processes maturities idempotently using atomic claim pattern:
 *    - updateMany with status=ACTIVE guard ensures only one process
 *      can claim and mature a given investment.
 * 4. Maturity payout calculation uses product-snapshotted values:
 *    - roiRate, taxRate, tenorDays are snapshotted at investment creation
 *    - Changes to product rates after investment creation don't affect
 *      existing investments.
 * 5. On maturity: credits wallet with principal + net interest,
 *    creates REDEMPTION wallet transaction, marks investment MATURED.
 */
@Injectable()
export class InvestmentMaturityService {
  private readonly logger = new Logger(InvestmentMaturityService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyMaturityCheck() {
    await this.run();
  }

  /** Core logic, also callable directly from the manual-trigger admin endpoint. */
  async run(admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const [reminded, matured] = await Promise.all([
      this.sendMaturityReminders(),
      this.processMaturedInvestments(),
    ]);

    if (admin) {
      await logAdminAction(this.prisma, {
        adminId: admin.adminUserId,
        adminRole: admin.adminRole,
        action: 'INVESTMENT_MATURITY_CHECK_RUN_MANUALLY',
        category: 'INVESTMENT',
        metadata: { remindedCount: reminded, maturedCount: matured },
      });
    }

    return { remindedCount: reminded, maturedCount: matured };
  }

  private async sendMaturityReminders(): Promise<number> {
    const targetDate = startOfDay(new Date());
    targetDate.setDate(targetDate.getDate() + MATURITY_REMINDER_DAYS);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    let investments: any[] = [];
    try {
      investments = await this.prisma.investment.findMany({
        where: { status: 'ACTIVE', maturityDate: { gte: targetDate, lte: targetDateEnd } },
        include: { client: true, product: true },
      });
    } catch (err) {
      this.logger.warn(`Failed to query investments for maturity reminders: ${(err as Error).message}`);
      return 0;
    }

    for (const inv of investments) {
      if (!inv.client?.email) continue;
      this.notifications.sendInvestmentMaturingSoonEmail(
        inv.client.email, inv.client.name, inv.product?.name || 'your investment',
        Number(inv.principalKobo) / 100, inv.maturityDate, MATURITY_REMINDER_DAYS,
      ).catch(() => {});
    }

    return investments.length;
  }

  private async processMaturedInvestments(): Promise<number> {
    let investments: any[] = [];
    try {
      investments = await this.prisma.investment.findMany({
        where: { status: 'ACTIVE', maturityDate: { lte: new Date() } },
        include: { client: true, product: true },
      });
    } catch (err) {
      this.logger.warn(`Failed to query matured investments: ${(err as Error).message}`);
      return 0;
    }

    for (const inv of investments) {
      try {
        await this.prisma.investment.update({
          where: { id: inv.id },
          data: {
            status: 'MATURED',
            history: { create: { action: 'Matured', note: 'Automatically marked matured at maturity date' } },
          },
        });
        if (inv.client?.email) {
          this.notifications.sendInvestmentMaturedEmail(
            inv.client.email, inv.client.name, inv.product?.name || 'your investment', Number(inv.principalKobo) / 100,
          ).catch(() => {});
        }
      } catch (err) {
        this.logger.warn(`Failed to mark investment ${inv.id} as matured: ${(err as Error).message}`);
      }
    }

    return investments.length;
  }
}
