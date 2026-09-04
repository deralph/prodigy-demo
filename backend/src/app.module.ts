import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { KycModule } from './kyc/kyc.module';
import { ProductsModule } from './products/products.module';
import { InvestmentsModule } from './investments/investments.module';
import { InvestmentMaturityModule } from './investment-maturity/investment-maturity.module';
import { WalletModule } from './wallet/wallet.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { PreTerminationModule } from './pre-termination/pre-termination.module';
import { FinanceQueueModule } from './finance-queue/finance-queue.module';
import { StaffLoansModule } from './staff-loans/staff-loans.module';
import { DividendsModule } from './dividends/dividends.module';
import { AuditModule } from './audit/audit.module';
import { AuditPortalModule } from './audit-portal/audit-portal.module';
import { ReportsModule } from './reports/reports.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ActivityModule } from './activity/activity.module';
import { NibssModule } from './nibss/nibss.module';
import { AdminPasswordModule } from './admin-password/admin-password.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CertificatesModule } from './certificates/certificates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MigrationModule } from './migration/migration.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ErpModule } from './erp/erp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    InvestmentMaturityModule,
    WalletModule,
    ApprovalsModule,
    PreTerminationModule,
    FinanceQueueModule,
    StaffLoansModule,
    DividendsModule,
    AuditModule,
    AuditPortalModule,
    ReportsModule,
    AdminUsersModule,
    NotificationsModule,
    WebhooksModule,
    ActivityModule,
    NibssModule,
    AdminPasswordModule,
    OnboardingModule,
    CertificatesModule,
    DashboardModule,
    MigrationModule,
    ReconciliationModule,
    ErpModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
