import { Module } from '@nestjs/common';
import { InvestmentMaturityService } from './investment-maturity.service';
import { InvestmentMaturityController } from './investment-maturity.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [InvestmentMaturityController],
  providers: [InvestmentMaturityService],
  exports: [InvestmentMaturityService],
})
export class InvestmentMaturityModule {}
