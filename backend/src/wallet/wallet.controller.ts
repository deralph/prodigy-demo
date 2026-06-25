import { Controller, Get, Post, Body, UseGuards, Req, Query, Param, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get the Paystack public key for the inline popup' })
  getConfig() {
    return this.walletService.getPaystackConfig();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get wallet balance and virtual account details' })
  getWallet(@Req() req: any) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have a wallet. Please use a client account.');
    }
    return this.walletService.getWallet(req.user.clientDbId);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  getTransactions(@Req() req: any, @Query() query: any) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have wallet transactions. Please use a client account.');
    }
    return this.walletService.getTransactions(req.user.clientDbId, query);
  }

  @Post('fund/initiate')
  @ApiOperation({ summary: 'Record a PENDING wallet funding transaction before Paystack inline popup' })
  async initiatePayment(@Req() req: any, @Body() body: { amountKobo: number; reference?: string }) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have a wallet.');
    }
    const amountKobo = BigInt(Math.round(body.amountKobo));
    return this.walletService.initiatePaystackPayment(
      req.user.clientDbId,
      req.user.email,
      amountKobo,
      body.reference,
    );
  }

  @Post('fund/verify')
  @ApiOperation({ summary: 'Verify and settle a Paystack payment after inline popup success' })
  async verifyPayment(@Req() req: any, @Body() body: { reference: string; amountKobo?: number }) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users do not have a wallet.');
    }
    if (!body.reference) {
      throw new BadRequestException('reference is required');
    }
    const amountKobo = body.amountKobo ? BigInt(Math.round(body.amountKobo)) : undefined;
    return this.walletService.verifyPayment(req.user.clientDbId, body.reference, req.user.email, amountKobo);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request wallet withdrawal (mandate rules enforced for joint accounts — AND mandate requires the other holder to co-sign)' })
  requestWithdrawal(
    @Req() req: any,
    @Body() body: { amountKobo: number; bankName: string; bankAcctNo: string; bankAcctName: string },
  ) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users cannot withdraw. Please use a client account.');
    }
    return this.walletService.requestWithdrawal(req.user.clientDbId, req.user.sub, {
      ...body,
      amountKobo: BigInt(Math.round(Number(body.amountKobo))),
    });
  }

  @Get('withdrawals/pending-cosign')
  @ApiOperation({ summary: 'Joint holder: withdrawals on this account awaiting MY co-signature' })
  getPendingCosign(@Req() req: any) {
    if (!req.user.clientDbId) throw new BadRequestException('Admin users do not have a wallet.');
    return this.walletService.getPendingCosignForHolder(req.user.clientDbId, req.user.sub);
  }

  @Post('withdrawals/:id/cosign')
  @ApiOperation({ summary: 'Joint holder: co-sign (approve) a withdrawal the other holder requested' })
  cosignWithdrawal(@Param('id') id: string, @Req() req: any) {
    if (!req.user.clientDbId) throw new BadRequestException('Admin users do not have a wallet.');
    return this.walletService.cosignWithdrawal(id, req.user.clientDbId, req.user.sub);
  }

  @Post('withdrawals/:id/decline-cosign')
  @ApiOperation({ summary: 'Joint holder: decline a withdrawal the other holder requested — returns funds to wallet' })
  declineCosign(@Param('id') id: string, @Req() req: any, @Body('reason') reason?: string) {
    if (!req.user.clientDbId) throw new BadRequestException('Admin users do not have a wallet.');
    return this.walletService.declineCosignWithdrawal(id, req.user.clientDbId, req.user.sub, reason);
  }
}

@ApiTags('Admin — Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/transactions')
export class AdminTransactionsController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters' })
  getAll(@Query() query: any) {
    return this.walletService.adminGetAll(query);
  }

  @Post(':id/approve-withdrawal')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Approve a pending withdrawal — automatically disburses via Paystack' })
  approveWithdrawal(@Param('id') id: string, @Req() req: any) {
    return this.walletService.approveWithdrawal(id, {
      adminId: req.user.adminUserId,
      adminRole: req.user.adminRole || 'unknown',
    });
  }

  @Post(':id/reject-withdrawal')
  @UseGuards(AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Reject a pending withdrawal — returns funds to wallet balance' })
  rejectWithdrawal(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    return this.walletService.rejectWithdrawal(id, {
      adminId: req.user.adminUserId,
      adminRole: req.user.adminRole || 'unknown',
    }, reason);
  }
}
