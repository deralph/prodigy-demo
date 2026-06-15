import { Module } from '@nestjs/common';
import { AuditPortalController } from './audit-portal.controller';
import { AuditPortalService } from './audit-portal.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AuditPortalController],
  providers: [AuditPortalService],
  exports: [AuditPortalService],
})
export class AuditPortalModule {}
