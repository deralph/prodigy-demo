import { Controller, Get, Post, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own investment portfolio' })
  getMyInvestments(@Req() req: any) {
    return this.investmentsService.getMyInvestments(req.user.clientDbId);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to an investment product' })
  subscribe(@Req() req: any, @Body() body: any) {
    return this.investmentsService.subscribe(req.user.clientDbId, body);
  }

  @Post(':id/redeem')
  @ApiOperation({ summary: 'Request early redemption (pre-termination)' })
  requestRedemption(@Req() req: any, @Param('id') id: string, @Body('reason') reason: string) {
    return this.investmentsService.requestRedemption(req.user.clientDbId, id, reason);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get investment statement' })
  getStatement(@Req() req: any, @Param('id') id: string) {
    return this.investmentsService.getStatement(id, req.user.clientDbId);
  }
}

@ApiTags('Admin — Investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/investments')
export class AdminInvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all investments with filters' })
  findAll(@Query() query: any) {
    return this.investmentsService.adminFindAll(query);
  }

  @Post('book')
  @ApiOperation({ summary: 'Book an investment instrument for a client' })
  book(@Body() body: any, @Req() req: any) {
    return this.investmentsService.adminBook(body, req.user.sub);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get any investment statement (admin)' })
  getStatement(@Param('id') id: string) {
    return this.investmentsService.getStatement(id);
  }
}
