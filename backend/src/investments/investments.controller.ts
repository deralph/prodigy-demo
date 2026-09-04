import { Controller, Get, Post, Param, Body, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own investment portfolio' })
  getMyInvestments(@Req() req: any) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have investments. Please use a client account.');
    }
    return this.investmentsService.getMyInvestments(req.user.clientDbId);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to an investment product' })
  subscribe(@Req() req: any, @Body() body: any) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users cannot subscribe to investments. Please use a client account.');
    }
    return this.investmentsService.subscribe(req.user.clientDbId, body);
  }

  @Post(':id/redeem')
  @ApiOperation({ summary: 'Request early redemption (pre-termination)' })
  requestRedemption(@Req() req: any, @Param('id') id: string, @Body('reason') reason: string) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users cannot redeem investments. Please use a client account.');
    }
    return this.investmentsService.requestRedemption(req.user.clientDbId, id, reason);
  }

  @Post(':id/redeem-interest')
  @ApiOperation({ summary: 'Redeem accrued interest into wallet balance (first time requires KYC Level 3)' })
  redeemAccruedInterest(@Req() req: any, @Param('id') id: string) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users cannot redeem interest. Please use a client account.');
    }
    return this.investmentsService.redeemAccruedInterest(req.user.clientDbId, id);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get investment statement' })
  getStatement(@Req() req: any, @Param('id') id: string) {
    return this.investmentsService.getStatement(id, req.user.clientDbId);
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'Get detailed investment with calculations and transactions' })
  getDetail(@Req() req: any, @Param('id') id: string) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have investments. Please use a client account.');
    }
    return this.investmentsService.getInvestmentDetail(id, req.user.clientDbId);
  }

  @Get(':id/calculation')
  @ApiOperation({ summary: 'Get investment calculation details (principal, interest, tax, payout)' })
  getCalculation(@Req() req: any, @Param('id') id: string) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have investments. Please use a client account.');
    }
    return this.investmentsService.getInvestmentCalculationDetails(id, req.user.clientDbId);
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
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'List all investments with filters' })
  findAll(@Query() query: any) {
    return this.investmentsService.adminFindAll(query);
  }

  @Post('book')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Book an investment instrument for a client' })
  book(@Body() body: any, @Req() req: any) {
    return this.investmentsService.adminBook(body, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Get(':id/statement')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'Get any investment statement (admin)' })
  getStatement(@Param('id') id: string) {
    return this.investmentsService.getStatement(id);
  }

  @Get(':id/detail')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'Get detailed investment with calculations and transactions (admin)' })
  getDetail(@Param('id') id: string) {
    return this.investmentsService.getInvestmentDetail(id);
  }

  @Get(':id/calculation')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT', 'AUDIT')
  @ApiOperation({ summary: 'Get investment calculation details (admin)' })
  getCalculation(@Param('id') id: string) {
    return this.investmentsService.getInvestmentCalculationDetails(id);
  }

  @Post('maturity/process')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Process matured investments (mark MATURED, credit wallet with payout)' })
  processMaturity(@Req() req: any) {
    return this.investmentsService.processMaturity(req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/paid-out')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Mark matured investment as PAID_OUT' })
  markPaidOut(@Param('id') id: string, @Req() req: any) {
    return this.investmentsService.markPaidOut(id, req.user.sub, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':id/close')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'OPERATIONS', 'INVESTMENT')
  @ApiOperation({ summary: 'Close an investment (ACTIVE or MATURED -> CLOSED)' })
  closeInvestment(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    return this.investmentsService.closeInvestment(id, req.user.sub, body.reason, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }
}