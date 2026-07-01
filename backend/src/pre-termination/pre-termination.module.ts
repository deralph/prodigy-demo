import { Module } from '@nestjs/common';
import { PreTerminationController } from './pre-termination.controller';
import { PreTerminationService } from './pre-termination.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PreTerminationController],
  providers: [PreTerminationService],
  exports: [PreTerminationService],
})
export class PreTerminationModule {}
