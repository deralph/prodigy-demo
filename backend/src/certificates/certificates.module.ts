import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvestmentsModule } from '../investments/investments.module';
import { WithholdingTaxModule } from '../withholding-tax/withholding-tax.module';

@Module({
  imports: [NotificationsModule, InvestmentsModule, WithholdingTaxModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}