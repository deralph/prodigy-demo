import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffLoansService } from './staff-loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Staff Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class StaffLoansController {
  constructor(private staffLoansService: StaffLoansService) {}

  @Get('corporate/me')
  @ApiOperation({ summary: 'Corporate client: get own entity staff loans' })
  getMyLoans(@Req() req: any) {
    return this.staffLoansService.getMyEntityLoans(req.user.clientDbId);
  }

  @Post('corporate/apply')
  @ApiOperation({ summary: 'Corporate client: submit a new staff loan application' })
  applyLoan(@Req() req: any, @Body() body: any) {
    return this.staffLoansService.applyLoan(req.user.clientDbId, body);
  }
}

@ApiTags('Admin — Staff Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/loans')
export class AdminStaffLoansController {
  constructor(private staffLoansService: StaffLoansService) {}

  @Get('corporate')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'AUDIT')
  @ApiOperation({ summary: 'List all corporate entities with staff loan summaries' })
  getAllEntities() {
    return this.staffLoansService.getAllCorporateEntities();
  }

  @Get('corporate/:entityId/staff')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'AUDIT')
  @ApiOperation({ summary: 'Get all staff loans for a specific corporate entity' })
  getEntityLoans(@Param('entityId') entityId: string) {
    return this.staffLoansService.getEntityLoans(entityId);
  }

  @Get(':id')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'AUDIT')
  @ApiOperation({ summary: 'Get single staff loan detail' })
  findOne(@Param('id') id: string) {
    return this.staffLoansService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS')
  @ApiOperation({ summary: 'Approve a pending staff loan and disburse to corporate wallet' })
  approveLoan(@Param('id') id: string, @Req() req: any) {
    return this.staffLoansService.approveLoan(id, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/reject')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS')
  @ApiOperation({ summary: 'Reject a pending staff loan' })
  rejectLoan(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req: any) {
    return this.staffLoansService.rejectLoan(id, body?.reason || '', { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/repayment')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS')
  @ApiOperation({ summary: 'Record a monthly repayment for an active staff loan' })
  recordRepayment(@Param('id') id: string, @Body() body: { amountKobo: number; note?: string }, @Req() req: any) {
    if (body.amountKobo === undefined || body.amountKobo === null) {
      throw new BadRequestException('Repayment amount is required.');
    }
    return this.staffLoansService.recordRepayment(id, body.amountKobo, body.note, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/restructure')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS')
  @ApiOperation({ summary: 'Restructure an active/overdue/defaulted loan (creates new loan, marks original RESTRUCTURED)' })
  restructureLoan(@Param('id') id: string, @Body() body: { newTenorMonths: number; newInterestRate?: number; reason: string }, @Req() req: any) {
    return this.staffLoansService.restructureLoan(id, req.user.sub, body, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/default')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS')
  @ApiOperation({ summary: 'Mark a loan as DEFAULTED' })
  markDefaulted(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    return this.staffLoansService.markLoanDefaulted(id, req.user.sub, body.reason, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Get(':id/schedule')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'AUDIT')
  @ApiOperation({ summary: 'Get loan repayment schedule with due dates and payment status' })
  getSchedule(@Param('id') id: string) {
    return this.staffLoansService.getRepaymentSchedule(id);
  }

  @Get(':id/calculation')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'AUDIT')
  @ApiOperation({ summary: 'Get detailed loan calculation breakdown' })
  getCalculation(@Param('id') id: string) {
    return this.staffLoansService.getLoanCalculationDetails(id);
  }

  @Post('overdue/check')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS')
  @ApiOperation({ summary: 'Check and mark overdue loans (run periodically)' })
  checkOverdue(@Req() req: any) {
    return this.staffLoansService.checkOverdueLoans(req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
