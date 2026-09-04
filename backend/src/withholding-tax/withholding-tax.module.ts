import { Module } from '@nestjs/common';
import { WithholdingTaxService } from './withholding-tax.service';
import { WithholdingTaxController } from './withholding-tax.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [WithholdingTaxController],
  providers: [WithholdingTaxService],
  exports: [WithholdingTaxService],
})
export class WithholdingTaxModule {}