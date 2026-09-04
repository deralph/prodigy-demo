import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/approvals')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Get()
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'List all approvals with optional status/type filter' })
  findAll(@Query() query: { status?: string; type?: string }) {
    return this.approvalsService.findAll(query);
  }

  @Post(':id/approve')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Approve a queued item' })
  approve(@Param('id') id: string, @Req() req: any, @Body('notes') notes?: string) {
    return this.approvalsService.approve(id, req.user.sub, notes, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/reject')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Reject a queued item with reason' })
  reject(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    return this.approvalsService.reject(id, req.user.sub, reason, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
