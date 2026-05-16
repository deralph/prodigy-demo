import { Module } from '@nestjs/common';
import { StaffLoansController } from './staff-loans.controller';
import { StaffLoansService } from './staff-loans.service';

@Module({
  controllers: [StaffLoansController],
  providers: [StaffLoansService],
  exports: [StaffLoansService],
})
export class StaffLoansModule {}
