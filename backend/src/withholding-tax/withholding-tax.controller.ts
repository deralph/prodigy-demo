import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WithholdingTaxService } from './withholding-tax.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Withholding Tax')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'AUDIT')
@Controller('admin/withholding-tax')
export class WithholdingTaxController {
  constructor(private withholdingTaxService: WithholdingTaxService) {}

  @Get()
  @ApiOperation({ summary: 'List withholding tax records with filters' })
  findAll(@Query() query: { clientId?: string; investmentId?: string; status?: string; dateFrom?: string; dateTo?: string }) {
    return this.withholdingTaxService.getWithholdingTaxHistory(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get withholding tax summary for reporting' })
  getSummary(@Query() query: { dateFrom?: string; dateTo?: string }) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    return this.withholdingTaxService.getWithholdingTaxSummary(dateFrom, dateTo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single withholding tax record' })
  findOne(@Param('id') id: string) {
    return this.withholdingTaxService.getWithholdingTaxHistory({ investmentId: id });
  }
}