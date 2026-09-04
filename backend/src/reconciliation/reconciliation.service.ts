import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ReconciliationResult {
  entity: string;
  entityId: string;
  check: string;
  status: 'MATCH' | 'MISMATCH' | 'MISSING_IN_SYSTEM' | 'MISSING_IN_SOURCE';
  systemValue: number;
  sourceValue: number;
  difference: number;
  details?: Record<string, any>;
}

export interface ReconciliationReport {
  timestamp: string;
  summary: {
    totalChecks: number;
    matches: number;
    mismatches: number;
    missingInSystem: number;
    missingInSource: number;
  };
  results: ReconciliationResult[];
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reconcile wallet balances for all clients
   * Compares: client.walletBalance vs sum of successful wallet transactions
   */
  async reconcileWalletBalances(clientId?: string): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const clients = await this.prisma.client.findMany({
      where: clientId ? { id: clientId } : {},
      include: {
        walletTransactions: {
          where: { status: 'SUCCESSFUL' },
          select: { type: true, amountKobo: true, disbursedAmountKobo: true, approvedAmountKobo: true },
        },
      },
    });

    for (const client of clients) {
      // Calculate expected balance from transactions
      let calculatedBalance = BigInt(0);
      for (const tx of client.walletTransactions) {
        const amount = tx.disbursedAmountKobo ?? tx.approvedAmountKobo ?? tx.amountKobo;
        if (['WALLET_FUNDING', 'REDEMPTION', 'DIVIDEND_PAYOUT', 'INTEREST', 'LOAN_REPAYMENT'].includes(tx.type)) {
          calculatedBalance += amount;
        } else if (['WALLET_WITHDRAWAL', 'FEE', 'LOAN_DISBURSEMENT'].includes(tx.type)) {
          calculatedBalance -= amount;
        }
      }

      const systemBalance = client.walletBalance;
      const difference = Number(systemBalance - calculatedBalance) / 100;

      results.push({
        entity: 'Client',
        entityId: client.id,
        check: 'wallet_balance',
        status: difference === 0 ? 'MATCH' : 'MISMATCH',
        systemValue: Number(systemBalance) / 100,
        sourceValue: Number(calculatedBalance) / 100,
        difference,
        details: { clientRef: client.clientRef, clientName: client.name },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile pending balances
   * Compares: client.pendingBalance vs sum of PENDING wallet transactions
   */
  async reconcilePendingBalances(clientId?: string): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const clients = await this.prisma.client.findMany({
      where: clientId ? { id: clientId } : {},
      include: {
        walletTransactions: {
          where: { status: 'PENDING' },
          select: { type: true, amountKobo: true },
        },
      },
    });

    for (const client of clients) {
      let calculatedPending = BigInt(0);
      for (const tx of client.walletTransactions) {
        // All pending transactions add to pending balance regardless of type
        calculatedPending += tx.amountKobo;
      }

      const systemPending = client.pendingBalance;
      const difference = Number(systemPending - calculatedPending) / 100;

      results.push({
        entity: 'Client',
        entityId: client.id,
        check: 'pending_balance',
        status: difference === 0 ? 'MATCH' : 'MISMATCH',
        systemValue: Number(systemPending) / 100,
        sourceValue: Number(calculatedPending) / 100,
        difference,
        details: { clientRef: client.clientRef, clientName: client.name },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile investment principals
   * Compares: investment.principalKobo vs wallet transaction SUBSCRIPTION amount
   */
  async reconcileInvestmentPrincipals(clientId?: string): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const investments = await this.prisma.investment.findMany({
      where: {
        isInternal: false,
        ...(clientId && { clientId }),
      },
      include: {
        client: { select: { clientRef: true, name: true } },
        walletTransactions: {
          where: { type: 'SUBSCRIPTION', status: 'SUCCESSFUL' },
          select: { amountKobo: true, txnRef: true },
        },
      },
    });

    for (const inv of investments) {
      const subscriptionTx = inv.walletTransactions[0];
      const txAmount = subscriptionTx ? Number(subscriptionTx.amountKobo) / 100 : 0;
      const invPrincipal = Number(inv.principalKobo) / 100;
      const difference = txAmount - invPrincipal;

      results.push({
        entity: 'Investment',
        entityId: inv.id,
        check: 'investment_principal',
        status: difference === 0 ? 'MATCH' : 'MISMATCH',
        systemValue: invPrincipal,
        sourceValue: txAmount,
        difference,
        details: {
          investRef: inv.investRef,
          clientRef: inv.client.clientRef,
          subscriptionTxnRef: subscriptionTx?.txnRef || 'NONE',
        },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile maturity payouts
   * Compares: maturity wallet transaction REDEMPTION amount vs calculated expected payout
   */
  async reconcileMaturityPayouts(): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const maturedInvestments = await this.prisma.investment.findMany({
      where: {
        isInternal: false,
        status: { in: ['MATURED', 'PAID_OUT'] },
      },
      include: {
        client: { select: { clientRef: true, name: true } },
        product: true,
        walletTransactions: {
          where: { type: 'REDEMPTION', status: 'SUCCESSFUL' },
          select: { amountKobo: true, txnRef: true, createdAt: true },
        },
      },
    });

    for (const inv of maturedInvestments) {
      const maturityTx = inv.walletTransactions[0];
      const txAmount = maturityTx ? Number(maturityTx.amountKobo) / 100 : 0;

      // Calculate expected payout
      const principal = Number(inv.principalKobo) / 100;
      const roiRate = Number(inv.roiRate);
      const taxRate = Number(inv.taxRate);
      const tenorDays = inv.tenorDays;
      const expectedInterest = principal * roiRate / 100 * tenorDays / 365;
      const expectedTax = expectedInterest * taxRate / 100;
      const expectedNetInterest = expectedInterest - expectedTax;
      const expectedPayout = principal + expectedNetInterest;

      const difference = txAmount - expectedPayout;

      results.push({
        entity: 'Investment',
        entityId: inv.id,
        check: 'maturity_payout',
        status: Math.abs(difference) < 0.01 ? 'MATCH' : 'MISMATCH', // Allow 1 kobo rounding
        systemValue: txAmount,
        sourceValue: expectedPayout,
        difference,
        details: {
          investRef: inv.investRef,
          clientRef: inv.client.clientRef,
          maturityTxnRef: maturityTx?.txnRef || 'NONE',
          principal,
          expectedInterest,
          expectedTax,
          expectedNetInterest,
        },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile interest redemptions
   * Compares: investment.interestRedeemedKobo vs sum of INTEREST wallet transactions
   */
  async reconcileInterestRedemptions(): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const investments = await this.prisma.investment.findMany({
      where: {
        isInternal: false,
        interestRedeemedKobo: { gt: 0 },
      },
      include: {
        client: { select: { clientRef: true, name: true } },
        walletTransactions: {
          where: { type: 'INTEREST', status: 'SUCCESSFUL' },
          select: { amountKobo: true, txnRef: true, createdAt: true },
        },
      },
    });

    for (const inv of investments) {
      const interestTxns = inv.walletTransactions;
      const txTotal = interestTxns.reduce((sum, tx) => sum + Number(tx.amountKobo), 0) / 100;
      const recordedRedeemed = Number(inv.interestRedeemedKobo) / 100;
      const difference = txTotal - recordedRedeemed;

      results.push({
        entity: 'Investment',
        entityId: inv.id,
        check: 'interest_redemption',
        status: Math.abs(difference) < 0.01 ? 'MATCH' : 'MISMATCH',
        systemValue: recordedRedeemed,
        sourceValue: txTotal,
        difference,
        details: {
          investRef: inv.investRef,
          clientRef: inv.client.clientRef,
          transactionCount: interestTxns.length,
          transactionRefs: interestTxns.map(t => t.txnRef).join(', '),
        },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile withholding tax
   * Compares: investment.withholdingTaxKobo vs sum of withholding tax records
   */
  async reconcileWithholdingTax(): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const investments = await this.prisma.investment.findMany({
      where: {
        isInternal: false,
        withholdingTaxKobo: { gt: 0 },
      },
      include: {
        client: { select: { clientRef: true, name: true } },
        withholdingTax: { select: { taxKobo: true, wtRef: true, status: true } },
      },
    });

    for (const inv of investments) {
      const wtTotal = inv.withholdingTax
        .filter(w => w.status === 'COLLECTED')
        .reduce((sum, w) => sum + Number(w.taxKobo), 0) / 100;
      const recordedTax = Number(inv.withholdingTaxKobo) / 100;
      const difference = wtTotal - recordedTax;

      results.push({
        entity: 'Investment',
        entityId: inv.id,
        check: 'withholding_tax',
        status: Math.abs(difference) < 0.01 ? 'MATCH' : 'MISMATCH',
        systemValue: recordedTax,
        sourceValue: wtTotal,
        difference,
        details: {
          investRef: inv.investRef,
          clientRef: inv.client.clientRef,
          wtRecordCount: inv.withholdingTax.length,
          wtRefs: inv.withholdingTax.map(w => w.wtRef).join(', '),
        },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile loan principals and repayments
   */
  async reconcileLoans(): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const loans = await this.prisma.staffLoan.findMany({
      include: {
        corporate: { select: { name: true } },
        client: { select: { clientRef: true, name: true } },
        repayments: { select: { amountKobo: true, paidAt: true } },
      },
    });

    for (const loan of loans) {
      // Check principal vs disbursement
      const repaidTotal = loan.repayments.reduce((sum, r) => sum + Number(r.amountKobo), 0) / 100;
      const principal = Number(loan.principalKobo) / 100;
      const outstanding = Number(loan.outstandingKobo) / 100;
      const expectedOutstanding = principal - repaidTotal;
      const diffOutstanding = outstanding - expectedOutstanding;

      results.push({
        entity: 'StaffLoan',
        entityId: loan.id,
        check: 'loan_outstanding',
        status: Math.abs(diffOutstanding) < 0.01 ? 'MATCH' : 'MISMATCH',
        systemValue: outstanding,
        sourceValue: expectedOutstanding,
        difference: diffOutstanding,
        details: {
          loanRef: loan.loanRef,
          corporate: loan.corporate?.name,
          clientRef: loan.client?.clientRef,
          principal,
          totalRepaid: repaidTotal,
          repaymentCount: loan.repayments.length,
        },
      });

      // Check interest earned
      const expectedInterest = principal * Number(loan.interestRate) / 100 * loan.tenorMonths / 12;
      const recordedInterest = Number(loan.interestEarnedKobo) / 100;
      const diffInterest = recordedInterest - expectedInterest;

      if (Math.abs(diffInterest) > 1) { // Only report significant differences
        results.push({
          entity: 'StaffLoan',
          entityId: loan.id,
          check: 'loan_interest',
          status: Math.abs(diffInterest) < 1 ? 'MATCH' : 'MISMATCH',
          systemValue: recordedInterest,
          sourceValue: expectedInterest,
          difference: diffInterest,
          details: {
            loanRef: loan.loanRef,
            interestRate: Number(loan.interestRate),
            tenorMonths: loan.tenorMonths,
          },
        });
      }
    }

    return this.buildReport(results);
  }

  /**
   * Reconcile dividend payouts
   */
  async reconcileDividends(): Promise<ReconciliationReport> {
    const results: ReconciliationResult[] = [];

    const dividends = await this.prisma.dividend.findMany({
      where: { status: 'PAID' },
      include: {
        product: true,
        entries: {
          include: { investment: { include: { client: { select: { clientRef: true } } } } },
        },
      },
    });

    for (const div of dividends) {
      const entryTotal = div.entries.reduce((sum, e) => sum + Number(e.amountKobo), 0) / 100;
      const declaredTotal = Number(div.totalPayoutKobo) / 100;
      const difference = entryTotal - declaredTotal;

      results.push({
        entity: 'Dividend',
        entityId: div.id,
        check: 'dividend_payout',
        status: Math.abs(difference) < 0.01 ? 'MATCH' : 'MISMATCH',
        systemValue: declaredTotal,
        sourceValue: entryTotal,
        difference,
        details: {
          dividendRef: div.dividendRef,
          product: div.product?.name,
          declaredTotal,
          eligibleCount: div.eligibleCount,
          paidCount: div.entries.filter(e => e.paidAt).length,
        },
      });
    }

    return this.buildReport(results);
  }

  /**
   * Run full reconciliation suite
   */
  async runFullReconciliation(): Promise<{
    walletBalances: ReconciliationReport;
    pendingBalances: ReconciliationReport;
    investmentPrincipals: ReconciliationReport;
    maturityPayouts: ReconciliationReport;
    interestRedemptions: ReconciliationReport;
    withholdingTax: ReconciliationReport;
    loans: ReconciliationReport;
    dividends: ReconciliationReport;
  }> {
    const [
      walletBalances,
      pendingBalances,
      investmentPrincipals,
      maturityPayouts,
      interestRedemptions,
      withholdingTax,
      loans,
      dividends,
    ] = await Promise.all([
      this.reconcileWalletBalances(),
      this.reconcilePendingBalances(),
      this.reconcileInvestmentPrincipals(),
      this.reconcileMaturityPayouts(),
      this.reconcileInterestRedemptions(),
      this.reconcileWithholdingTax(),
      this.reconcileLoans(),
      this.reconcileDividends(),
    ]);

    // Log summary
    const allResults = [
      ...walletBalances.results,
      ...pendingBalances.results,
      ...investmentPrincipals.results,
      ...maturityPayouts.results,
      ...interestRedemptions.results,
      ...withholdingTax.results,
      ...loans.results,
      ...dividends.results,
    ];

    const mismatches = allResults.filter(r => r.status === 'MISMATCH').length;
    this.logger.log(`Full reconciliation complete: ${allResults.length} checks, ${mismatches} mismatches`);

    return {
      walletBalances,
      pendingBalances,
      investmentPrincipals,
      maturityPayouts,
      interestRedemptions,
      withholdingTax,
      loans,
      dividends,
    };
  }

  /**
   * Get reconciliation report for a specific client
   */
  async getClientReconciliation(clientRef: string): Promise<{
    client: { clientRef: string; name: string; walletBalance: number; pendingBalance: number };
    walletBalances: ReconciliationReport;
    pendingBalances: ReconciliationReport;
    investments: ReconciliationReport;
    discrepancies: ReconciliationResult[];
  }> {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { clientRef },
      select: { id: true, clientRef: true, name: true, walletBalance: true, pendingBalance: true },
    });

    const [walletBalances, pendingBalances, investments] = await Promise.all([
      this.reconcileWalletBalances(client.id),
      this.reconcilePendingBalances(client.id),
      this.reconcileInvestmentPrincipals(client.id),
    ]);

    const allResults = [
      ...walletBalances.results,
      ...pendingBalances.results,
      ...investments.results,
    ];

    return {
      client: {
        clientRef: client.clientRef,
        name: client.name,
        walletBalance: Number(client.walletBalance) / 100,
        pendingBalance: Number(client.pendingBalance) / 100,
      },
      walletBalances,
      pendingBalances,
      investments,
      discrepancies: allResults.filter(r => r.status !== 'MATCH'),
    };
  }

  private buildReport(results: ReconciliationResult[]): ReconciliationReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: results.length,
        matches: results.filter(r => r.status === 'MATCH').length,
        mismatches: results.filter(r => r.status === 'MISMATCH').length,
        missingInSystem: results.filter(r => r.status === 'MISSING_IN_SYSTEM').length,
        missingInSource: results.filter(r => r.status === 'MISSING_IN_SOURCE').length,
      },
      results,
    };
  }
}