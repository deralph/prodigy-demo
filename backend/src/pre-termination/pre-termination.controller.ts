import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PreTerminationService } from './pre-termination.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin — Pre-Termination')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/preterminations')
export class PreTerminationController {
  constructor(private preTermService: PreTerminationService) {}

  @Get()
  @ApiOperation({ summary: 'List pre-termination queue with optional status filter' })
  findAll(@Query() query: { status?: string }) {
    return this.preTermService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single pre-termination request' })
  findOne(@Param('id') id: string) {
    return this.preTermService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Ops approves pre-termination → routes to Finance Queue' })
  approveOps(@Param('id') id: string, @Req() req: any) {
    return this.preTermService.approveOps(id, req.user.sub);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Ops rejects pre-termination with reason' })
  rejectOps(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    return this.preTermService.rejectOps(id, req.user.sub, reason);
  }
}
