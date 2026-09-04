import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Audit')
@ApiBearerAuth()
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'COMPLIANCE', 'AUDIT')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs with server-side filtering' })
  findAll(@Query() query: {
    page?: string;
    limit?: string;
    category?: string;
    adminId?: string;
    clientId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.auditService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs (respects same filters as findAll)' })
  async export(@Query() query: {
    category?: string;
    adminId?: string;
    clientId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.auditService.export(query);
  }
}
