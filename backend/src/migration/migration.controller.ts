import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MigrationService, HistoricalTransaction, HistoricalInvestment, ValidationResult, MigrationReport } from './migration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Historical Migration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'AUDIT')
@Controller('admin/migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('validate/transactions')
  @ApiOperation({ summary: 'Validate historical transaction data (dry run)' })
  async validateTransactions(@Body() transactions: HistoricalTransaction[]): Promise<ValidationResult> {
    if (!Array.isArray(transactions)) {
      throw new BadRequestException('Request body must be an array of transactions');
    }
    return this.migrationService.validateTransactions(transactions);
  }

  @Post('validate/investments')
  @ApiOperation({ summary: 'Validate historical investment data (dry run)' })
  async validateInvestments(@Body() investments: HistoricalInvestment[]): Promise<ValidationResult> {
    if (!Array.isArray(investments)) {
      throw new BadRequestException('Request body must be an array of investments');
    }
    return this.migrationService.validateInvestments(investments);
  }

  @Post('dry-run')
  @ApiOperation({ summary: 'Full dry run for transactions and investments' })
  async dryRun(
    @Body() body: { transactions?: HistoricalTransaction[]; investments?: HistoricalInvestment[] },
  ): Promise<MigrationReport> {
    return this.migrationService.dryRun(body.transactions || [], body.investments || []);
  }

  @Post('import/transactions')
  @ApiOperation({ summary: 'Import historical transactions (requires confirm=true)' })
  async importTransactions(
    @Body() body: { transactions: HistoricalTransaction[]; confirm: boolean },
  ): Promise<MigrationReport> {
    if (!body.confirm) {
      throw new BadRequestException('Import requires confirm=true. Run dry-run first to verify data.');
    }
    return this.migrationService.importTransactions(body.transactions, true);
  }

  @Post('import/investments')
  @ApiOperation({ summary: 'Import historical investments (requires confirm=true)' })
  async importInvestments(
    @Body() body: { investments: HistoricalInvestment[]; confirm: boolean },
  ): Promise<MigrationReport> {
    if (!body.confirm) {
      throw new BadRequestException('Import requires confirm=true. Run dry-run first to verify data.');
    }
    return this.migrationService.importInvestments(body.investments, true);
  }

  @Post('reconcile')
  @ApiOperation({ summary: 'Reconcile historical data for a client against system state' })
  async reconcile(
    @Body() body: { clientRef: string; dateFrom: string; dateTo: string },
  ) {
    return this.migrationService.reconcileTransactions(
      body.clientRef,
      new Date(body.dateFrom),
      new Date(body.dateTo),
    );
  }
}