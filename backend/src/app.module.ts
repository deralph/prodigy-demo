import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { KycModule } from './kyc/kyc.module';
import { ProductsModule } from './products/products.module';
import { InvestmentsModule } from './investments/investments.module';
import { WalletModule } from './wallet/wallet.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { PreTerminationModule } from './pre-termination/pre-termination.module';
import { FinanceQueueModule } from './finance-queue/finance-queue.module';
import { StaffLoansModule } from './staff-loans/staff-loans.module';
import { DividendsModule } from './dividends/dividends.module';
import { LegacyModule } from './legacy/legacy.module';
import { AuditModule } from './audit/audit.module';
import { AuditPortalModule } from './audit-portal/audit-portal.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ActivityModule } from './activity/activity.module';
import { StatementsModule } from './statements/statements.module';
import { NibssModule } from './nibss/nibss.module';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60') * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100'),
      },
    ]),
    PrismaModule,
    AuthModule,
    ClientsModule,
    KycModule,
    ProductsModule,
    InvestmentsModule,
    WalletModule,
    ApprovalsModule,
    PreTerminationModule,
    FinanceQueueModule,
    StaffLoansModule,
    DividendsModule,
    LegacyModule,
    AuditModule,
    AuditPortalModule,
    AnalyticsModule,
    ReportsModule,
    AdminUsersModule,
    NotificationsModule,
    WebhooksModule,
    ActivityModule,
    StatementsModule,
    NibssModule,
    GoalsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
