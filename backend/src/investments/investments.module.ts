import { Module } from '@nestjs/common';
import { InvestmentsController, AdminInvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [InvestmentsController, AdminInvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
