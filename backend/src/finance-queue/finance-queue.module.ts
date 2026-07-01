import { Module } from '@nestjs/common';
import { FinanceQueueController } from './finance-queue.controller';
import { FinanceQueueService } from './finance-queue.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FinanceQueueController],
  providers: [FinanceQueueService],
  exports: [FinanceQueueService],
})
export class FinanceQueueModule {}
