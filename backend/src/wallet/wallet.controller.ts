import { Controller, Get, Post, Body, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
  @ApiOperation({ summary: 'Request wallet withdrawal' })
  requestWithdrawal(@Req() req: any, @Body() body: any) {
    if (!req.user.clientDbId) {
      throw new BadRequestException('Admin users cannot withdraw. Please use a client account.');
    }
    return this.walletService.requestWithdrawal(req.user.clientDbId, body);
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
}
