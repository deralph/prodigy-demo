import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async onClientRegistered(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { authUsers: { where: { holderType: 'PRIMARY' } } },
    });
    if (!client) return;

    const primaryAuth = client.authUsers[0];
    if (!primaryAuth) return;

    await this.notifications.sendWelcomeEmail(
      client.email,
      client.name,
      client.clientRef,
      client.type.toLowerCase() as 'individual' | 'joint' | 'corporate',
    ).catch(() => {});

    if (client.type === 'JOINT' && client.secondaryEmail) {
      await this.notifications.sendWelcomeEmail(
        client.secondaryEmail,
        client.secondaryName || 'Co-holder',
        client.clientRef,
        'joint',
      ).catch(() => {});
    }

    this.logger.log(`Welcome email sent for client ${client.clientRef}`);
  }

  async onKycSubmitted(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    await this.notifications.sendKycSubmittedEmail(client.email, client.name).catch(() => {});

    if (client.type === 'JOINT' && client.secondaryEmail) {
      await this.notifications.sendKycSubmittedEmail(
        client.secondaryEmail,
        client.secondaryName || 'Co-holder',
      ).catch(() => {});
    }

    this.logger.log(`KYC submission confirmation sent for client ${client.clientRef}`);
  }

  async onKycApproved(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    await this.notifications.sendWelcomeActiveAccount(client.email, client.name, client.clientRef).catch(() => {});

    if (client.type === 'JOINT' && client.secondaryEmail) {
      await this.notifications.sendWelcomeActiveAccount(
        client.secondaryEmail,
        client.secondaryName || 'Co-holder',
        client.clientRef,
      ).catch(() => {});
    }

    this.logger.log(`Account active email sent for client ${client.clientRef}`);
  }

  async onKycRejected(clientId: string, reason?: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    await this.notifications.sendKycApprovalEmail(client.email, 'rejected', reason).catch(() => {});

    if (client.type === 'JOINT' && client.secondaryEmail) {
      await this.notifications.sendKycApprovalEmail(
        client.secondaryEmail,
        'rejected',
        reason,
      ).catch(() => {});
    }

    this.logger.log(`KYC rejection email sent for client ${client.clientRef}`);
  }

  async onFirstLoginAfterActivation(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { walletTransactions: { where: { status: 'SUCCESSFUL', type: 'WALLET_FUNDING' }, take: 1 } },
    });
    if (!client) return;

    const hasFunded = client.walletTransactions.length > 0;

    if (!hasFunded) {
      await this.notifications.sendWalletFundingReminder(client.email, client.name, client.clientRef).catch(() => {});

      if (client.type === 'JOINT' && client.secondaryEmail) {
        await this.notifications.sendWalletFundingReminder(
          client.secondaryEmail,
          client.secondaryName || 'Co-holder',
          client.clientRef,
        ).catch(() => {});
      }
    } else {
      const hasInvested = await this.prisma.investment.count({ where: { clientId } });
      if (hasInvested === 0) {
        await this.notifications.sendFirstInvestmentGuidance(client.email, client.name, client.clientRef).catch(() => {});

        if (client.type === 'JOINT' && client.secondaryEmail) {
          await this.notifications.sendFirstInvestmentGuidance(
            client.secondaryEmail,
            client.secondaryName || 'Co-holder',
            client.clientRef,
          ).catch(() => {});
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendKycSubmissionReminders() {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const clients = await this.prisma.client.findMany({
      where: {
        status: 'PENDING_KYC',
        createdAt: { lte: threeDaysAgo },
      },
    });

    for (const client of clients) {
      const daysSinceRegistration = Math.floor((Date.now() - client.createdAt.getTime()) / (24 * 60 * 60 * 1000));

      if (daysSinceRegistration === 3 || daysSinceRegistration === 7 || daysSinceRegistration === 14) {
        await this.notifications.sendKycSubmissionReminder(client.email, client.name, client.clientRef, daysSinceRegistration).catch(() => {});
        this.logger.log(`KYC reminder (day ${daysSinceRegistration}) sent for client ${client.clientRef}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendFirstInvestmentReminders() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const clients = await this.prisma.client.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: sevenDaysAgo },
        investments: { none: {} },
        walletTransactions: { some: { status: 'SUCCESSFUL', type: 'WALLET_FUNDING' } },
      },
    });

    for (const client of clients) {
      await this.notifications.sendFirstInvestmentGuidance(client.email, client.name, client.clientRef).catch(() => {});
      this.logger.log(`First investment reminder sent for client ${client.clientRef}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendWalletFundingReminders() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const clients = await this.prisma.client.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: sevenDaysAgo },
        walletBalance: 0,
        walletTransactions: { none: { status: 'SUCCESSFUL', type: 'WALLET_FUNDING' } },
      },
    });

    for (const client of clients) {
      await this.notifications.sendWalletFundingReminder(client.email, client.name, client.clientRef).catch(() => {});
      this.logger.log(`Wallet funding reminder sent for client ${client.clientRef}`);
    }
  }
}