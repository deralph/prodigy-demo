import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
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

  @Get('me')
  @ApiOperation({ summary: 'Get wallet balance and virtual account details' })
  getWallet(@Req() req: any) {
    return this.walletService.getWallet(req.user.clientDbId);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  getTransactions(@Req() req: any, @Query() query: any) {
    return this.walletService.getTransactions(req.user.clientDbId, query);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request wallet withdrawal' })
  requestWithdrawal(@Req() req: any, @Body() body: any) {
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
