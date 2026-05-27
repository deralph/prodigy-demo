import { Module } from '@nestjs/common';
import { StaffLoansController, AdminStaffLoansController } from './staff-loans.controller';
import { StaffLoansService } from './staff-loans.service';

@Module({
  controllers: [StaffLoansController, AdminStaffLoansController],
  providers: [StaffLoansService],
  exports: [StaffLoansService],
})
export class StaffLoansModule {}
