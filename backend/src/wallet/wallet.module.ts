import { Module } from '@nestjs/common';
import { WalletController, AdminTransactionsController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  controllers: [WalletController, AdminTransactionsController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
