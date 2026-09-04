import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('client')
  @ApiOperation({ summary: 'Get client dashboard with portfolio overview' })
  async getClientDashboard(@Req() req: any) {
    if (!req.user.clientDbId) {
      throw new Error('Admin users do not have a client dashboard. Use admin dashboard.');
    }
    return this.dashboardService.getClientDashboard(req.user.clientDbId);
  }

  @Get('admin')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles('SUPER_ADMIN', 'FINANCE', 'OPERATIONS', 'COMPLIANCE', 'AUDIT', 'INVESTMENT')
  @ApiOperation({ summary: 'Get admin dashboard with portfolio metrics' })
  async getAdminDashboard(@Req() req: any) {
    const admin = { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole };
    return this.dashboardService.getAdminDashboard(admin);
  }
}