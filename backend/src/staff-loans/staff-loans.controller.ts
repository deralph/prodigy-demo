import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffLoansService } from './staff-loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
  @ApiOperation({ summary: 'List all corporate entities with staff loan summaries' })
  getAllEntities() {
    return this.staffLoansService.getAllCorporateEntities();
  }

  @Get('corporate/:entityId/staff')
  @ApiOperation({ summary: 'Get all staff loans for a specific corporate entity' })
  getEntityLoans(@Param('entityId') entityId: string) {
    return this.staffLoansService.getEntityLoans(entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single staff loan detail' })
  findOne(@Param('id') id: string) {
    return this.staffLoansService.findOne(id);
  }
}
