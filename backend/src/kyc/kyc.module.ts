import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [NotificationsModule, OnboardingModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
