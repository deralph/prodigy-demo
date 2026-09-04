import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PreTerminationService } from './pre-termination.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Pre-Termination')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/preterminations')
export class PreTerminationController {
  constructor(private preTermService: PreTerminationService) {}

  @Get()
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'List pre-termination queue with optional status filter' })
  findAll(@Query() query: { status?: string }) {
    return this.preTermService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'Get single pre-termination request' })
  findOne(@Param('id') id: string) {
    return this.preTermService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Ops approves pre-termination → routes to Finance Queue' })
  approveOps(@Param('id') id: string, @Req() req: any) {
    return this.preTermService.approveOps(id, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/reject')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Ops rejects pre-termination with reason' })
  rejectOps(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    return this.preTermService.rejectOps(id, req.user.sub, reason, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}
