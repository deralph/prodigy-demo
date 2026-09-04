import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ErpService } from './erp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — ERP Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'AUDIT')
@Controller('admin/erp')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  @Get('requirements')
  @ApiOperation({ summary: 'Get ERP integration requirements documentation' })
  getRequirements() {
    return { documentation: this.erpService.getIntegrationRequirements() };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get ERP integration status' })
  getStatus() {
    return {
      configured: false,
      message: 'ERP integration not configured. No ERP specification provided.',
      documentationEndpoint: '/admin/erp/requirements',
    };
  }
}