import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'AUDIT')
@Controller('admin/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('wallet-balances')
  @ApiOperation({ summary: 'Reconcile wallet balances for all clients' })
  async reconcileWalletBalances(@Query('clientId') clientId?: string) {
    return this.reconciliationService.reconcileWalletBalances(clientId);
  }

  @Get('pending-balances')
  @ApiOperation({ summary: 'Reconcile pending balances for all clients' })
  async reconcilePendingBalances(@Query('clientId') clientId?: string) {
    return this.reconciliationService.reconcilePendingBalances(clientId);
  }

  @Get('investment-principals')
  @ApiOperation({ summary: 'Reconcile investment principals against subscription transactions' })
  async reconcileInvestmentPrincipals(@Query('clientId') clientId?: string) {
    return this.reconciliationService.reconcileInvestmentPrincipals(clientId);
  }

  @Get('maturity-payouts')
  @ApiOperation({ summary: 'Reconcile maturity payouts against expected payouts' })
  async reconcileMaturityPayouts() {
    return this.reconciliationService.reconcileMaturityPayouts();
  }

  @Get('interest-redemptions')
  @ApiOperation({ summary: 'Reconcile interest redemptions against recorded amounts' })
  async reconcileInterestRedemptions() {
    return this.reconciliationService.reconcileInterestRedemptions();
  }

  @Get('withholding-tax')
  @ApiOperation({ summary: 'Reconcile withholding tax against collected records' })
  async reconcileWithholdingTax() {
    return this.reconciliationService.reconcileWithholdingTax();
  }

  @Get('loans')
  @ApiOperation({ summary: 'Reconcile loan principals, repayments, and interest' })
  async reconcileLoans() {
    return this.reconciliationService.reconcileLoans();
  }

  @Get('dividends')
  @ApiOperation({ summary: 'Reconcile dividend payouts against declared amounts' })
  async reconcileDividends() {
    return this.reconciliationService.reconcileDividends();
  }

  @Post('full')
  @ApiOperation({ summary: 'Run full reconciliation suite across all entities' })
  async runFullReconciliation() {
    return this.reconciliationService.runFullReconciliation();
  }

  @Get('client/:clientRef')
  @ApiOperation({ summary: 'Get full reconciliation report for a specific client' })
  async getClientReconciliation(@Query('clientRef') clientRef: string) {
    return this.reconciliationService.getClientReconciliation(clientRef);
  }
}