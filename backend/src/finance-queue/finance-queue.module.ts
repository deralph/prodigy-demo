import { Module } from '@nestjs/common';
import { FinanceQueueController } from './finance-queue.controller';
import { FinanceQueueService } from './finance-queue.service';

@Module({
  controllers: [FinanceQueueController],
  providers: [FinanceQueueService],
  exports: [FinanceQueueService],
})
export class FinanceQueueModule {}
