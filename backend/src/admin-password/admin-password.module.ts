import { Module } from '@nestjs/common';
import { AdminPasswordService } from './admin-password.service';
import { AdminPasswordController } from './admin-password.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminPasswordController],
  providers: [AdminPasswordService],
  exports: [AdminPasswordService],
})
export class AdminPasswordModule {}