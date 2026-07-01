import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { logAdminAction } from '../common/audit/log-admin-action';

// How many days before maturity to send the "maturing soon" reminder.
// Single fixed trigger point (not a range) so the daily cron sends it
// exactly once per investment, without needing an extra "reminderSentAt"
// column on the Investment model.
const MATURITY_REMINDER_DAYS = 3;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

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
