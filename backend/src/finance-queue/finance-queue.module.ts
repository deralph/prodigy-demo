import { Module } from '@nestjs/common';
import { FinanceQueueController } from './finance-queue.controller';
import { FinanceQueueService } from './finance-queue.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [FinanceQueueController],
  providers: [FinanceQueueService],
  exports: [FinanceQueueService],
})
export class FinanceQueueModule {}
