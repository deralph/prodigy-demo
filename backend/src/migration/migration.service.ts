import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HistoricalTransaction {
  clientRef: string;
  clientName: string;
  clientEmail: string;
  type: 'WALLET_FUNDING' | 'WALLET_WITHDRAWAL' | 'SUBSCRIPTION' | 'REDEMPTION' | 'DIVIDEND_PAYOUT' | 'INTEREST' | 'FEE';
  amount: number; // in Naira
  currency: string; // NGN
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  reference: string;
  description?: string;
  bankName?: string;
  bankAcctNo?: string;
  bankAcctName?: string;
  transactionDate: string; // ISO date string
  valueDate?: string; // ISO date string
  metadata?: Record<string, any>;
}

export interface HistoricalInvestment {
  clientRef: string;
  investRef: string;
  productName: string;
  productCode: string;
  principal: number; // in Naira
  roiRate: number; // percentage
  taxRate: number; // percentage
  tenorDays: number;
  valueDate: string; // ISO date string
  maturityDate: string; // ISO date string
  status: 'ACTIVE' | 'MATURED' | 'PAID_OUT' | 'CLOSED' | 'PRE_TERMINATED';
  interestPaid?: number; // in Naira
  withholdingTaxPaid?: number; // in Naira
  bookedBy?: string; // admin reference
  bookedAt?: string; // ISO date string
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MigrationReport {
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    duplicatesFound: number;
    clientsMatched: number;
    clientsNotFound: number;
    investmentsMatched: number;
    investmentsNotFound: number;
  };
  details: {
    clients: Array<{ clientRef: string; matched: boolean; clientId?: string; error?: string }>;
    transactions: Array<{ reference: string; status: 'imported' | 'skipped' | 'error'; error?: string; transactionId?: string }>;
    investments: Array<{ investRef: string; status: 'imported' | 'skipped' | 'error'; error?: string; investmentId?: string }>;
  };
  errors: string[];
  warnings: string[];
  timestamp: string;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate historical transaction data before import
   * DRY RUN - does not persist anything
   */
  async validateTransactions(transactions: HistoricalTransaction[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const prefix = `Row ${i + 1} (${tx.reference}):`;

      // Required fields
      if (!tx.clientRef) errors.push(`${prefix} Missing clientRef`);
      if (!tx.clientName) errors.push(`${prefix} Missing clientName`);
      if (!tx.clientEmail) errors.push(`${prefix} Missing clientEmail`);
      if (!tx.type) errors.push(`${prefix} Missing type`);
      if (tx.amount === undefined || tx.amount === null) errors.push(`${prefix} Missing amount`);
      if (!tx.currency) errors.push(`${prefix} Missing currency`);
      if (!tx.status) errors.push(`${prefix} Missing status`);
      if (!tx.reference) errors.push(`${prefix} Missing reference`);
      if (!tx.transactionDate) errors.push(`${prefix} Missing transactionDate`);

      // Validate amount
      if (tx.amount !== undefined && tx.amount !== null) {
        if (tx.amount <= 0) errors.push(`${prefix} Amount must be positive`);
        if (tx.amount > 1_000_000_000) warnings.push(`${prefix} Unusually large amount: ₦${tx.amount.toLocaleString()}`);
      }

      // Validate currency
      if (tx.currency && tx.currency !== 'NGN') {
        warnings.push(`${prefix} Non-NGN currency: ${tx.currency}`);
      }

      // Validate status
      const validStatuses = ['SUCCESSFUL', 'FAILED', 'PENDING', 'REVERSED'];
      if (tx.status && !validStatuses.includes(tx.status)) {
        errors.push(`${prefix} Invalid status: ${tx.status}`);
      }

      // Validate type
      const validTypes = ['WALLET_FUNDING', 'WALLET_WITHDRAWAL', 'SUBSCRIPTION', 'REDEMPTION', 'DIVIDEND_PAYOUT', 'INTEREST', 'FEE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT'];
      if (tx.type && !validTypes.includes(tx.type)) {
        errors.push(`${prefix} Invalid type: ${tx.type}`);
      }

      // Validate dates
      if (tx.transactionDate) {
        const date = new Date(tx.transactionDate);
        if (isNaN(date.getTime())) errors.push(`${prefix} Invalid transactionDate format`);
        else if (date > new Date()) warnings.push(`${prefix} Future transaction date`);
      }

      // Check for duplicate reference within the batch
      const duplicateIndex = transactions.findIndex((t, idx) => idx !== i && t.reference === tx.reference);
      if (duplicateIndex >= 0) {
        warnings.push(`${prefix} Duplicate reference in batch (also at row ${duplicateIndex + 1})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate historical investment data before import
   * DRY RUN - does not persist anything
   */
  async validateInvestments(investments: HistoricalInvestment[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < investments.length; i++) {
      const inv = investments[i];
      const prefix = `Row ${i + 1} (${inv.investRef}):`;

      // Required fields
      if (!inv.clientRef) errors.push(`${prefix} Missing clientRef`);
      if (!inv.investRef) errors.push(`${prefix} Missing investRef`);
      if (!inv.productName) errors.push(`${prefix} Missing productName`);
      if (!inv.productCode) errors.push(`${prefix} Missing productCode`);
      if (inv.principal === undefined || inv.principal === null) errors.push(`${prefix} Missing principal`);
      if (inv.roiRate === undefined || inv.roiRate === null) errors.push(`${prefix} Missing roiRate`);
      if (inv.taxRate === undefined || inv.taxRate === null) errors.push(`${prefix} Missing taxRate`);
      if (inv.tenorDays === undefined || inv.tenorDays === null) errors.push(`${prefix} Missing tenorDays`);
      if (!inv.valueDate) errors.push(`${prefix} Missing valueDate`);
      if (!inv.maturityDate) errors.push(`${prefix} Missing maturityDate`);
      if (!inv.status) errors.push(`${prefix} Missing status`);

      // Validate principal
      if (inv.principal !== undefined && inv.principal !== null) {
        if (inv.principal <= 0) errors.push(`${prefix} Principal must be positive`);
      }

      // Validate rates
      if (inv.roiRate !== undefined && (inv.roiRate < 0 || inv.roiRate > 100)) {
        errors.push(`${prefix} ROI rate must be between 0 and 100`);
      }
      if (inv.taxRate !== undefined && (inv.taxRate < 0 || inv.taxRate > 100)) {
        errors.push(`${prefix} Tax rate must be between 0 and 100`);
      }

      // Validate tenor
      if (inv.tenorDays !== undefined && inv.tenorDays <= 0) {
        errors.push(`${prefix} Tenor must be positive`);
      }

      // Validate dates
      if (inv.valueDate) {
        const date = new Date(inv.valueDate);
        if (isNaN(date.getTime())) errors.push(`${prefix} Invalid valueDate format`);
      }
      if (inv.maturityDate) {
        const date = new Date(inv.maturityDate);
        if (isNaN(date.getTime())) errors.push(`${prefix} Invalid maturityDate format`);
      }
      if (inv.valueDate && inv.maturityDate) {
        const valueDate = new Date(inv.valueDate);
        const maturityDate = new Date(inv.maturityDate);
        if (!isNaN(valueDate.getTime()) && !isNaN(maturityDate.getTime()) && maturityDate <= valueDate) {
          errors.push(`${prefix} Maturity date must be after value date`);
        }
      }

      // Validate status
      const validStatuses = ['ACTIVE', 'MATURED', 'PAID_OUT', 'CLOSED', 'PRE_TERMINATED', 'REJECTED'];
      if (inv.status && !validStatuses.includes(inv.status)) {
        errors.push(`${prefix} Invalid status: ${inv.status}`);
      }

      // Check for duplicate investRef within the batch
      const duplicateIndex = investments.findIndex((t, idx) => idx !== i && t.investRef === inv.investRef);
      if (duplicateIndex >= 0) {
        warnings.push(`${prefix} Duplicate investRef in batch (also at row ${duplicateIndex + 1})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Dry run migration - validates and reports what would be imported
   */
  async dryRun(transactions: HistoricalTransaction[] = [], investments: HistoricalInvestment[] = []): Promise<MigrationReport> {
    const clientMatches = new Map<string, { clientId: string; matched: boolean }>();
    const existingTxRefs = new Set<string>();
    const existingInvestRefs = new Set<string>();

    // Check existing transaction references
    if (transactions.length > 0) {
      const existingTx = await this.prisma.walletTransaction.findMany({
        where: { txnRef: { in: transactions.map(t => t.reference) } },
        select: { txnRef: true },
      });
      existingTx.forEach(t => existingTxRefs.add(t.txnRef));
    }

    // Check existing investment references
    if (investments.length > 0) {
      const existingInv = await this.prisma.investment.findMany({
        where: { investRef: { in: investments.map(i => i.investRef) } },
        select: { investRef: true },
      });
      existingInv.forEach(i => existingInvestRefs.add(i.investRef));
    }

    // Match clients
    const clientDetails = await this.prisma.client.findMany({
      where: {
        clientRef: { in: [...transactions.map(t => t.clientRef), ...investments.map(i => i.clientRef)] },
      },
      select: { id: true, clientRef: true, name: true, email: true },
    });

    const clientMap = new Map(clientDetails.map(c => [c.clientRef, c]));

    // Build report
    const report: MigrationReport = {
      summary: {
        totalRecords: transactions.length + investments.length,
        validRecords: 0,
        invalidRecords: 0,
        duplicatesFound: 0,
        clientsMatched: 0,
        clientsNotFound: 0,
        investmentsMatched: 0,
        investmentsNotFound: 0,
      },
      details: {
        clients: [],
        transactions: [],
        investments: [],
      },
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString(),
    };

    // Check clients for transactions
    for (const tx of transactions) {
      const client = clientMap.get(tx.clientRef);
      if (client) {
        report.details.clients.push({ clientRef: tx.clientRef, matched: true, clientId: client.id });
        report.summary.clientsMatched++;
      } else {
        report.details.clients.push({ clientRef: tx.clientRef, matched: false, error: 'Client not found' });
        report.summary.clientsNotFound++;
      }
    }

    // Check clients for investments
    for (const inv of investments) {
      const client = clientMap.get(inv.clientRef);
      if (client) {
        report.details.clients.push({ clientRef: inv.clientRef, matched: true, clientId: client.id });
        report.summary.clientsMatched++;
      } else {
        report.details.clients.push({ clientRef: inv.clientRef, matched: false, error: 'Client not found' });
        report.summary.clientsNotFound++;
      }
    }

    // Check transactions
    for (const tx of transactions) {
      if (existingTxRefs.has(tx.reference)) {
        report.details.transactions.push({ reference: tx.reference, status: 'skipped', error: 'Duplicate reference already exists' });
        report.summary.duplicatesFound++;
      } else {
        const client = clientMap.get(tx.clientRef);
        if (client) {
          report.details.transactions.push({ reference: tx.reference, status: 'imported' });
          report.summary.validRecords++;
        } else {
          report.details.transactions.push({ reference: tx.reference, status: 'error', error: 'Client not found' });
          report.summary.invalidRecords++;
        }
      }
    }

    // Check investments
    for (const inv of investments) {
      if (existingInvestRefs.has(inv.investRef)) {
        report.details.investments.push({ investRef: inv.investRef, status: 'skipped', error: 'Duplicate investRef already exists' });
        report.summary.duplicatesFound++;
      } else {
        const client = clientMap.get(inv.clientRef);
        if (client) {
          report.details.investments.push({ investRef: inv.investRef, status: 'imported' });
          report.summary.validRecords++;
        } else {
          report.details.investments.push({ investRef: inv.investRef, status: 'error', error: 'Client not found' });
          report.summary.invalidRecords++;
        }
      }
    }

    return report;
  }

  /**
   * Import historical transactions (PRODUCTION USE - only after dry run validation)
   * Requires explicit confirmation
   */
  async importTransactions(transactions: HistoricalTransaction[], confirm = false): Promise<MigrationReport> {
    if (!confirm) {
      throw new BadRequestException('Import requires explicit confirmation. Set confirm=true to proceed.');
    }

    const report = await this.dryRun(transactions, []);
    if (report.summary.invalidRecords > 0 || report.summary.clientsNotFound > 0) {
      throw new BadRequestException('Cannot import with invalid records or unmatched clients. Run dryRun first.');
    }

    // Import transactions
    for (const tx of transactions) {
      if (report.details.transactions.find(d => d.reference === tx.reference && d.status === 'imported')) {
        const client = await this.prisma.client.findUnique({ where: { clientRef: tx.clientRef } });
        if (!client) continue;

        const amountKobo = BigInt(Math.round(tx.amount * 100));

        await this.prisma.$transaction(async (prisma) => {
          // Create wallet transaction
          await prisma.walletTransaction.create({
            data: {
              txnRef: tx.reference,
              clientId: client.id,
              type: tx.type as any,
              status: tx.status as any,
              amountKobo,
              approvedAmountKobo: tx.status === 'SUCCESSFUL' ? amountKobo : null,
              disbursedAmountKobo: tx.status === 'SUCCESSFUL' ? amountKobo : null,
              description: tx.description || `Historical import: ${tx.type}`,
              bankName: tx.bankName,
              bankAcctNo: tx.bankAcctNo,
              bankAcctName: tx.bankAcctName,
              createdAt: new Date(tx.transactionDate),
              processedAt: tx.status === 'SUCCESSFUL' ? new Date(tx.transactionDate) : null,
              approvedAt: tx.status === 'SUCCESSFUL' ? new Date(tx.transactionDate) : null,
              metadata: tx.metadata,
            },
          });

          // Update client wallet balance if successful
          if (tx.status === 'SUCCESSFUL') {
            if (['WALLET_FUNDING', 'REDEMPTION', 'DIVIDEND_PAYOUT', 'INTEREST', 'LOAN_REPAYMENT'].includes(tx.type)) {
              await prisma.client.update({
                where: { id: client.id },
                data: { walletBalance: { increment: amountKobo } },
              });
            } else if (['WALLET_WITHDRAWAL', 'FEE', 'LOAN_DISBURSEMENT'].includes(tx.type)) {
              await prisma.client.update({
                where: { id: client.id },
                data: { walletBalance: { decrement: amountKobo } },
              });
            }
          }
        });

        this.logger.log(`Imported historical transaction ${tx.reference} for client ${tx.clientRef}`);
      }
    }

    return report;
  }

  /**
   * Import historical investments (PRODUCTION USE - only after dry run validation)
   */
  async importInvestments(investments: HistoricalInvestment[], confirm = false): Promise<MigrationReport> {
    if (!confirm) {
      throw new BadRequestException('Import requires explicit confirmation. Set confirm=true to proceed.');
    }

    const report = await this.dryRun([], investments);
    if (report.summary.invalidRecords > 0 || report.summary.clientsNotFound > 0) {
      throw new BadRequestException('Cannot import with invalid records or unmatched clients. Run dryRun first.');
    }

    // Get product mapping
    const productCodes = [...new Set(investments.map(i => i.productCode))];
    const products = await this.prisma.product.findMany({
      where: { code: { in: productCodes } },
      select: { id: true, code: true, name: true },
    });
    const productMap = new Map(products.map(p => [p.code, p]));

    // Import investments
    for (const inv of investments) {
      const detail = report.details.investments.find(d => d.investRef === inv.investRef && d.status === 'imported');
      if (!detail) continue;

      const client = await this.prisma.client.findUnique({ where: { clientRef: inv.clientRef } });
      const product = productMap.get(inv.productCode);
      if (!client || !product) continue;

      const principalKobo = BigInt(Math.round(inv.principal * 100));
      const valueDate = new Date(inv.valueDate);
      const maturityDate = new Date(inv.maturityDate);

      await this.prisma.investment.create({
        data: {
          investRef: inv.investRef,
          clientId: client.id,
          productId: product.id,
          status: inv.status as any,
          principalKobo,
          roiRate: inv.roiRate,
          taxRate: inv.taxRate,
          tenorDays: inv.tenorDays,
          valueDate,
          maturityDate,
          bookedById: inv.bookedBy,
          bookedAt: inv.bookedAt ? new Date(inv.bookedAt) : valueDate,
          approvedById: inv.bookedBy,
          approvedAt: inv.bookedAt ? new Date(inv.bookedAt) : valueDate,
          interestRedeemedKobo: inv.interestPaid ? BigInt(Math.round(inv.interestPaid * 100)) : BigInt(0),
          withholdingTaxKobo: inv.withholdingTaxPaid ? BigInt(Math.round(inv.withholdingTaxPaid * 100)) : BigInt(0),
        },
      });

      this.logger.log(`Imported historical investment ${inv.investRef} for client ${inv.clientRef}`);
    }

    return report;
  }

  /**
   * Reconcile historical data against current system state
   */
  async reconcileTransactions(clientRef: string, dateFrom: Date, dateTo: Date): Promise<{
    systemTotal: number;
    importedTotal: number;
    discrepancies: Array<{ reference: string; systemAmount: number; importedAmount: number; difference: number }>;
  }> {
    // Get system transactions
    const systemTxns = await this.prisma.walletTransaction.findMany({
      where: {
        client: { clientRef },
        status: 'SUCCESSFUL',
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: { txnRef: true, amountKobo: true },
    });

    // This would need imported data to compare against
    // For now, return system totals for manual reconciliation
    return {
      systemTotal: systemTxns.reduce((sum, tx) => sum + Number(tx.amountKobo) / 100, 0),
      importedTotal: 0,
      discrepancies: [],
    };
  }
}