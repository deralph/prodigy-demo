import { Module } from '@nestjs/common';
import { InvestmentsController, AdminInvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';

@Module({
  controllers: [InvestmentsController, AdminInvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
