import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}