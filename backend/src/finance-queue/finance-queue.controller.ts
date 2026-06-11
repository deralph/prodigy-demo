import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceQueueService } from './finance-queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin — Finance Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/finance-queue')
export class FinanceQueueController {
  constructor(private financeQueueService: FinanceQueueService) {}

  @Get()
  @ApiOperation({ summary: 'List finance queue items' })
  findAll(@Query() query: { status?: string }) {
    return this.financeQueueService.findAll(query);
  }

  @Get('org-ledger')
  @ApiOperation({ summary: 'List org-level income/expense ledger entries' })
  getOrgLedger(@Query() query: { type?: string }) {
    return this.financeQueueService.findAllOrgLedger(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single finance queue item' })
  findOne(@Param('id') id: string) {
    return this.financeQueueService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Finance approves disbursement — credits client wallet' })
  approve(@Param('id') id: string, @Req() req: any, @Body('notes') notes?: string) {
    return this.financeQueueService.approve(id, req.user.sub, notes);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Finance rejects disbursement with reason' })
  reject(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    return this.financeQueueService.reject(id, req.user.sub, reason);
  }
}
