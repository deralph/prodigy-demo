import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ReportQuery {
  type: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  status?: string;
}

interface CompanyConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly companyConfig: CompanyConfig = {
    name: process.env.COMPANY_NAME || 'Prodigy Finance',
    address: process.env.COMPANY_ADDRESS || 'Victoria Island, Lagos, Nigeria',
    phone: process.env.COMPANY_PHONE || '+234-1-XXX-XXXX',
    email: process.env.COMPANY_EMAIL || 'info@prodigyfinance.ng',
    logoUrl: process.env.COMPANY_LOGO_URL || undefined,
  };

  async findAll(query: { type?: string }) {
    return {
      availableReports: [
        { type: 'investment_summary', label: 'Investment Summary' },
        { type: 'transaction_ledger', label: 'Transaction Ledger' },
        { type: 'client_portfolio', label: 'Client Portfolio' },
        { type: 'dividend_report', label: 'Dividend Report' },
        { type: 'maturity_schedule', label: 'Maturity Schedule' },
        { type: 'withholding_tax', label: 'Withholding Tax Report' },
        { type: 'loan_portfolio', label: 'Loan Portfolio' },
        { type: 'audit_trail', label: 'Audit Trail' },
        { type: 'outstanding_loans', label: 'Outstanding Loans' },
        { type: 'repayments', label: 'Repayments' },
        { type: 'pending_approvals', label: 'Pending Approvals' },
        { type: 'financial_exceptions', label: 'Financial Exceptions' },
        { type: 'reversals', label: 'Reversals' },
        { type: 'adjustments', label: 'Adjustments' },
      ],
    };
  }

  async generate(query: ReportQuery, admin: { adminUserId?: string; adminRole?: string }): Promise<any> {
    const { type, startDate, endDate, clientId, status } = query;

    // Validate and parse dates
    const dateFrom = startDate ? this.parseDate(startDate) : undefined;
    const dateTo = endDate ? this.parseDate(endDate, true) : undefined;

    if (dateFrom && isNaN(dateFrom.getTime())) {
      throw new BadRequestException('Invalid startDate format. Use YYYY-MM-DD.');
    }
    if (dateTo && isNaN(dateTo.getTime())) {
      throw new BadRequestException('Invalid endDate format. Use YYYY-MM-DD.');
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException('startDate cannot be after endDate.');
    }

    let data: any = null;
    let title = '';
    let description = '';

    switch (type) {
      case 'investment_summary':
        data = await this.getInvestmentSummary(dateFrom, dateTo, clientId, status);
        title = 'Investment Summary Report';
        description = 'Summary of all investments with principal, interest, and maturity details';
        break;
      case 'transaction_ledger':
        data = await this.getTransactionLedger(dateFrom, dateTo, clientId, status);
        title = 'Transaction Ledger Report';
        description = 'Complete transaction history with filters';
        break;
      case 'client_portfolio':
        data = await this.getClientPortfolio(dateFrom, dateTo, clientId);
        title = 'Client Portfolio Report';
        description = 'Client investment portfolio with current valuations';
        break;
      case 'dividend_report':
        data = await this.getDividendReport(dateFrom, dateTo, clientId);
        title = 'Dividend Report';
        description = 'Dividend declarations and payouts';
        break;
      case 'maturity_schedule':
        data = await this.getMaturitySchedule(dateFrom, dateTo, clientId);
        title = 'Maturity Schedule Report';
        description = 'Upcoming and past investment maturities';
        break;
      case 'withholding_tax':
        data = await this.getWithholdingTaxReport(dateFrom, dateTo, clientId);
        title = 'Withholding Tax Report';
        description = 'Withholding tax collected on investment income';
        break;
      case 'loan_portfolio':
        data = await this.getLoanPortfolio(dateFrom, dateTo, clientId, status);
        title = 'Loan Portfolio Report';
        description = 'Staff loan portfolio with repayment schedules';
        break;
      case 'audit_trail':
        data = await this.getAuditTrail(dateFrom, dateTo, clientId);
        title = 'Audit Trail Report';
        description = 'Administrative audit log with filters';
        break;
      case 'outstanding_loans':
        data = await this.getOutstandingLoansReport(dateFrom, dateTo, clientId);
        title = 'Outstanding Loans Report';
        description = 'Loans with outstanding balances';
        break;
      case 'repayments':
        data = await this.getRepaymentsReport(dateFrom, dateTo, clientId);
        title = 'Repayments Report';
        description = 'Loan repayment history with filters';
        break;
      case 'pending_approvals':
        data = await this.getPendingApprovalsReport(dateFrom, dateTo, clientId, status);
        title = 'Pending Approvals Report';
        description = 'Items awaiting approval across all approval types';
        break;
      case 'financial_exceptions':
        data = await this.getFinancialExceptionsReport(dateFrom, dateTo, clientId);
        title = 'Financial Exceptions Report';
        description = 'Transactions and investments with anomalies';
        break;
      case 'reversals':
        data = await this.getReversalsReport(dateFrom, dateTo, clientId);
        title = 'Reversals Report';
        description = 'Reversed transactions with reasons';
        break;
      case 'adjustments':
        data = await this.getAdjustmentsReport(dateFrom, dateTo, clientId);
        title = 'Adjustments Report';
        description = 'Adjusted transactions with corrections';
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }

    const report = {
      type,
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.adminUserId,
      generatedByRole: admin.adminRole,
      dateRange: {
        from: dateFrom?.toISOString() || null,
        to: dateTo?.toISOString() || null,
      },
      filters: { clientId, status },
      company: this.companyConfig,
      data,
      recordCount: Array.isArray(data) ? data.length : (data?.items?.length ?? 0),
    };

    // Audit log for report generation
    await logAdminAction(this.prisma, {
      adminId: admin.adminUserId,
      adminRole: admin.adminRole,
      action: 'REPORT_GENERATED',
      category: 'SYSTEM',
      metadata: {
        reportType: type,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        clientId,
        status,
        recordCount: report.recordCount,
      },
    });

    return report;
  }

  private parseDate(dateStr: string, endOfDay = false): Date {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  }

  private buildDateFilter(dateFrom?: Date, dateTo?: Date, field = 'createdAt') {
    const where: any = {};
    if (dateFrom || dateTo) {
      where[field] = {};
      if (dateFrom) where[field].gte = dateFrom;
      if (dateTo) where[field].lte = dateTo;
    }
    return where;
  }

  private async getInvestmentSummary(dateFrom?: Date, dateTo?: Date, clientId?: string, status?: string) {
    const where: any = { isInternal: false, ...this.buildDateFilter(dateFrom, dateTo, 'valueDate') };
    if (clientId) where.client = { clientRef: clientId };
    if (status) where.status = status as any;

    const investments = await this.prisma.investment.findMany({
      where,
      include: { product: true, client: { select: { clientRef: true, name: true, email: true, type: true } } },
      orderBy: { valueDate: 'desc' },
    });

    const summary = investments.map(inv => ({
      investRef: inv.investRef,
      client: inv.client,
      product: inv.product?.name,
      productCategory: inv.product?.category,
      principal: Number(inv.principalKobo) / 100,
      roiRate: Number(inv.roiRate),
      tenorDays: inv.tenorDays,
      valueDate: inv.valueDate,
      maturityDate: inv.maturityDate,
      status: inv.status,
      expectedInterest: this.calculateExpectedInterest(inv),
      expectedTax: this.calculateExpectedTax(inv),
      expectedNetInterest: this.calculateExpectedNetInterest(inv),
      expectedPayout: this.calculateExpectedPayout(inv),
      actualInterestPaid: Number(inv.interestRedeemedKobo || 0) / 100,
      withholdingTaxPaid: Number(inv.withholdingTaxKobo || 0) / 100,
      isInternal: inv.isInternal,
    }));

    const totals = {
      totalPrincipal: summary.reduce((s, i) => s + i.principal, 0),
      totalExpectedInterest: summary.reduce((s, i) => s + i.expectedInterest, 0),
      totalExpectedTax: summary.reduce((s, i) => s + i.expectedTax, 0),
      totalExpectedNetInterest: summary.reduce((s, i) => s + i.expectedNetInterest, 0),
      totalExpectedPayout: summary.reduce((s, i) => s + i.expectedPayout, 0),
      totalInterestPaid: summary.reduce((s, i) => s + i.actualInterestPaid, 0),
      totalWithholdingTaxPaid: summary.reduce((s, i) => s + i.withholdingTaxPaid, 0),
      byStatus: this.groupBy(summary, 'status'),
      byProductCategory: this.groupBy(summary, 'productCategory'),
    };

    return { items: summary, totals };
  }

  private async getTransactionLedger(dateFrom?: Date, dateTo?: Date, clientId?: string, status?: string) {
    const where: any = { ...this.buildDateFilter(dateFrom, dateTo, 'createdAt') };
    if (clientId) where.client = { clientRef: clientId };
    if (status) where.status = status as any;

    const transactions = await this.prisma.walletTransaction.findMany({
      where,
      include: {
        client: { select: { clientRef: true, name: true, email: true, type: true } },
        investment: { select: { investRef: true, product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = transactions.map(tx => ({
      txnRef: tx.txnRef,
      client: tx.client,
      type: tx.type,
      status: tx.status,
      amount: Number(tx.amountKobo) / 100,
      approvedAmount: tx.approvedAmountKobo ? Number(tx.approvedAmountKobo) / 100 : null,
      disbursedAmount: tx.disbursedAmountKobo ? Number(tx.disbursedAmountKobo) / 100 : null,
      description: tx.description,
      bankName: tx.bankName,
      bankAcctNo: tx.bankAcctNo,
      bankAcctName: tx.bankAcctName,
      paystackRef: tx.paystackRef,
      paystackTransferCode: tx.paystackTransferCode,
      failureReason: tx.failureReason,
      investment: tx.investment,
      initiatedById: tx.initiatedById,
      approvedById: tx.approvedById,
      requiresCoSign: tx.requiresCoSign,
      coSignedByAuthUserId: tx.coSignedByAuthUserId,
      createdAt: tx.createdAt,
      processedAt: tx.processedAt,
      approvedAt: tx.approvedAt,
    }));

    const totals = {
      totalAmount: items.reduce((s, i) => s + i.amount, 0),
      totalApproved: items.filter(i => i.approvedAmount).reduce((s, i) => s + (i.approvedAmount || 0), 0),
      totalDisbursed: items.filter(i => i.disbursedAmount).reduce((s, i) => s + (i.disbursedAmount || 0), 0),
      byType: this.groupBy(items, 'type'),
      byStatus: this.groupBy(items, 'status'),
    };

    return { items, totals };
  }

  private async getClientPortfolio(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = { isInternal: false };
    if (clientId) where.clientRef = clientId;

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        investments: {
          where: { isInternal: false },
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
        kycRecord: true,
        walletTransactions: {
          where: { status: 'SUCCESSFUL', type: 'WALLET_FUNDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const portfolios = clients.map(client => {
      const activeInvestments = client.investments.filter(i => i.status === 'ACTIVE');
      const maturedInvestments = client.investments.filter(i => ['MATURED', 'PAID_OUT'].includes(i.status));
      const pendingInvestments = client.investments.filter(i => i.status === 'PENDING_APPROVAL');

      return {
        client: {
          clientRef: client.clientRef,
          name: client.name,
          email: client.email,
          type: client.type,
          status: client.status,
          walletBalance: Number(client.walletBalance || 0) / 100,
          kycStatus: client.kycRecord?.status || 'NOT_SUBMITTED',
        },
        investments: {
          total: client.investments.length,
          active: activeInvestments.length,
          matured: maturedInvestments.length,
          pending: pendingInvestments.length,
          totalPrincipal: client.investments.reduce((s, i) => s + Number(i.principalKobo) / 100, 0),
          activePrincipal: activeInvestments.reduce((s, i) => s + Number(i.principalKobo) / 100, 0),
          expectedTotalPayout: client.investments.reduce((s, i) => s + this.calculateExpectedPayout(i), 0),
        },
        lastFunded: client.walletTransactions[0]?.createdAt || null,
      };
    });

    return { items: portfolios };
  }

  private async getDividendReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = { ...this.buildDateFilter(dateFrom, dateTo, 'declarationDate') };

    const dividends = await this.prisma.dividend.findMany({
      where,
      include: {
        product: true,
        entries: {
          include: { investment: { include: { client: { select: { clientRef: true, name: true, email: true } } } } },
        },
      },
      orderBy: { declarationDate: 'desc' },
    });

    const items = dividends.map(div => ({
      dividendRef: div.dividendRef,
      product: div.product?.name,
      rate: Number(div.rate),
      totalPayout: Number(div.totalPayoutKobo) / 100,
      eligibleCount: div.eligibleCount,
      declarationDate: div.declarationDate,
      paymentDate: div.paymentDate,
      status: div.status,
      entries: div.entries.map(e => ({
        client: e.investment?.client,
        investmentRef: e.investment?.investRef,
        amount: Number(e.amountKobo) / 100,
        paidAt: e.paidAt,
      })),
    }));

    const totals = {
      totalDeclared: items.reduce((s, i) => s + i.totalPayout, 0),
      totalPaid: items.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalPayout, 0),
      byStatus: this.groupBy(items, 'status'),
      byProduct: this.groupBy(items, 'product'),
    };

    return { items, totals };
  }

  private async getMaturitySchedule(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = { isInternal: false, ...this.buildDateFilter(dateFrom, dateTo, 'maturityDate') };
    if (clientId) where.client = { clientRef: clientId };

    const investments = await this.prisma.investment.findMany({
      where,
      include: { product: true, client: { select: { clientRef: true, name: true, email: true, type: true } } },
      orderBy: { maturityDate: 'asc' },
    });

    const items = investments.map(inv => ({
      investRef: inv.investRef,
      client: inv.client,
      product: inv.product?.name,
      principal: Number(inv.principalKobo) / 100,
      roiRate: Number(inv.roiRate),
      tenorDays: inv.tenorDays,
      valueDate: inv.valueDate,
      maturityDate: inv.maturityDate,
      status: inv.status,
      expectedInterest: this.calculateExpectedInterest(inv),
      expectedTax: this.calculateExpectedTax(inv),
      expectedNetInterest: this.calculateExpectedNetInterest(inv),
      expectedPayout: this.calculateExpectedPayout(inv),
      daysToMaturity: inv.maturityDate ? Math.max(0, Math.ceil((new Date(inv.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
    }));

    const byStatus = this.groupBy(items, 'status');

    return { items, byStatus, totalUpcoming: items.filter(i => i.status === 'ACTIVE').length };
  }

  private async getWithholdingTaxReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = { status: 'COLLECTED', ...this.buildDateFilter(dateFrom, dateTo, 'collectedAt') };
    if (clientId) where.client = { clientRef: clientId };

    const records = await this.prisma.withholdingTax.findMany({
      where,
      include: { investment: { include: { product: true, client: { select: { clientRef: true, name: true } } } } },
      orderBy: { collectedAt: 'desc' },
    });

    const items = records.map(r => ({
      wtRef: r.wtRef,
      client: r.investment?.client,
      investmentRef: r.investment?.investRef,
      product: r.investment?.product?.name,
      grossInterest: Number(r.grossInterestKobo) / 100,
      taxRate: Number(r.taxRate),
      taxAmount: Number(r.taxKobo) / 100,
      netInterest: Number(r.netInterestKobo) / 100,
      collectedAt: r.collectedAt,
      collectedById: r.collectedById,
    }));

    const totals = {
      totalTaxCollected: items.reduce((s, i) => s + i.taxAmount, 0),
      totalGrossInterest: items.reduce((s, i) => s + i.grossInterest, 0),
      totalNetInterest: items.reduce((s, i) => s + i.netInterest, 0),
      byMonth: this.groupByMonth(items, 'collectedAt'),
    };

    return { items, totals };
  }

  private async getLoanPortfolio(dateFrom?: Date, dateTo?: Date, clientId?: string, status?: string) {
    const where: any = { ...this.buildDateFilter(dateFrom, dateTo, 'createdAt') };
    if (clientId) where.client = { clientRef: clientId };
    if (status) where.status = status as any;

    const loans = await this.prisma.staffLoan.findMany({
      where,
      include: {
        corporate: true,
        client: { select: { clientRef: true, name: true, email: true } },
        repayments: { orderBy: { paidAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = loans.map(loan => {
      const totalPaid = loan.repayments.reduce((s, r) => s + Number(r.amountKobo) / 100, 0);
      const outstanding = Number(loan.outstandingKobo) / 100;
      const principal = Number(loan.principalKobo) / 100;
      const interestRate = Number(loan.interestRate);

      return {
        loanRef: loan.loanRef,
        corporate: loan.corporate?.name,
        client: loan.client,
        staffName: loan.staffName,
        principal,
        interestRate,
        tenorMonths: loan.tenorMonths,
        monthlyPayment: Number(loan.monthlyPaymentKobo) / 100,
        status: loan.status,
        disbursedAt: loan.disbursedAt,
        maturityDate: loan.maturityDate,
        outstanding,
        totalPaid,
        interestEarned: Number(loan.interestEarnedKobo) / 100,
        repaymentCount: loan.repayments.length,
      };
    });

    const totals = {
      totalPrincipal: items.reduce((s, i) => s + i.principal, 0),
      totalOutstanding: items.reduce((s, i) => s + i.outstanding, 0),
      totalInterestEarned: items.reduce((s, i) => s + i.interestEarned, 0),
      totalRepaid: items.reduce((s, i) => s + i.totalPaid, 0),
      byStatus: this.groupBy(items, 'status'),
      byCorporate: this.groupBy(items, 'corporate'),
    };

    return { items, totals };
  }

  private async getAuditTrail(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = { ...this.buildDateFilter(dateFrom, dateTo, 'occurredAt') };
    if (clientId) where.targetEntity = clientId;

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: { admin: { select: { adminRef: true, name: true, role: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 5000,
    });

    const items = logs.map(log => ({
      auditRef: log.auditRef,
      admin: log.admin,
      action: log.action,
      targetEntity: log.targetEntity,
      category: log.category,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      occurredAt: log.occurredAt,
    }));

    return { items, totals: { total: items.length, byCategory: this.groupBy(items, 'category'), byAction: this.groupBy(items, 'action') } };
  }

  private calculateExpectedInterest(inv: any): number {
    return Number(inv.principalKobo) * Number(inv.roiRate) / 100 * inv.tenorDays / 365 / 100;
  }

  private calculateExpectedTax(inv: any): number {
    return this.calculateExpectedInterest(inv) * Number(inv.taxRate) / 100;
  }

  private calculateExpectedNetInterest(inv: any): number {
    return this.calculateExpectedInterest(inv) - this.calculateExpectedTax(inv);
  }

  private calculateExpectedPayout(inv: any): number {
    return Number(inv.principalKobo) / 100 + this.calculateExpectedNetInterest(inv);
  }

  private groupBy<T extends Record<string, any>>(items: T[], key: string): Record<string, { count: number; total?: number }> {
    return items.reduce((acc, item) => {
      const value = item[key] || 'unknown';
      if (!acc[value]) acc[value] = { count: 0, total: 0 };
      acc[value].count++;
      // Try to find a numeric field to sum
      const numericFields = ['principal', 'amount', 'totalPayout', 'taxAmount', 'expectedPayout', 'expectedInterest'];
      for (const field of numericFields) {
        if (item[field] !== undefined) {
          acc[value].total = (acc[value].total || 0) + item[field];
          break;
        }
      }
      return acc;
    }, {} as Record<string, { count: number; total?: number }>);
  }

  private groupByMonth<T extends Record<string, any>>(items: T[], dateKey: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const date = item[dateKey];
      if (!date) return acc;
      const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM
      const value = item.taxAmount || item.amount || item.totalPayout || item.principal || 0;
      acc[month] = (acc[month] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getOutstandingLoansReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = {
      status: { in: ['ACTIVE', 'OVERDUE', 'DEFAULTED', 'RESTRUCTURED'] },
      outstandingKobo: { gt: 0 },
      ...this.buildDateFilter(dateFrom, dateTo, 'createdAt'),
    };
    if (clientId) where.client = { clientRef: clientId };

    const loans = await this.prisma.staffLoan.findMany({
      where,
      include: {
        corporate: true,
        client: { select: { clientRef: true, name: true, email: true } },
        repayments: { orderBy: { paidAt: 'asc' } },
      },
      orderBy: { outstandingKobo: 'desc' },
    });

    const items = loans.map(loan => ({
      loanRef: loan.loanRef,
      corporate: loan.corporate?.name,
      client: loan.client,
      staffName: loan.staffName,
      principal: Number(loan.principalKobo) / 100,
      interestRate: Number(loan.interestRate),
      tenorMonths: loan.tenorMonths,
      monthlyPayment: Number(loan.monthlyPaymentKobo) / 100,
      status: loan.status,
      disbursedAt: loan.disbursedAt,
      maturityDate: loan.maturityDate,
      outstanding: Number(loan.outstandingKobo) / 100,
      totalPaid: loan.repayments.reduce((s, r) => s + Number(r.amountKobo) / 100, 0),
      interestEarned: Number(loan.interestEarnedKobo) / 100,
      overdueSince: loan.status === 'OVERDUE' ? loan.updatedAt : null,
    }));

    const totals = {
      totalOutstanding: items.reduce((s, i) => s + i.outstanding, 0),
      totalPrincipal: items.reduce((s, i) => s + i.principal, 0),
      byStatus: this.groupBy(items, 'status'),
      byCorporate: this.groupBy(items, 'corporate'),
    };

    return { items, totals };
  }

  private async getRepaymentsReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = { ...this.buildDateFilter(dateFrom, dateTo, 'paidAt') };
    if (clientId) where.loan = { client: { clientRef: clientId } };

    const repayments = await this.prisma.loanRepayment.findMany({
      where,
      include: {
        loan: {
          include: {
            corporate: true,
            client: { select: { clientRef: true, name: true, email: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const items = repayments.map(r => ({
      loanRef: r.loan.loanRef,
      corporate: r.loan.corporate?.name,
      client: r.loan.client,
      staffName: r.loan.staffName,
      amount: Number(r.amountKobo) / 100,
      paidAt: r.paidAt,
      note: r.note,
    }));

    const totals = {
      totalRepaid: items.reduce((s, i) => s + i.amount, 0),
      count: items.length,
      byMonth: this.groupByMonth(items, 'paidAt'),
      byCorporate: this.groupBy(items, 'corporate'),
    };

    return { items, totals };
  }

  private async getPendingApprovalsReport(dateFrom?: Date, dateTo?: Date, clientId?: string, status?: string) {
    const where: any = { status: 'PENDING', ...this.buildDateFilter(dateFrom, dateTo, 'submittedAt') };
    if (clientId) where.client = { clientRef: clientId };
    if (status) where.type = status as any;

    const approvals = await this.prisma.approval.findMany({
      where,
      include: {
        client: { select: { clientRef: true, name: true, email: true, type: true } },
        investment: { include: { product: true } },
        product: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    const items = approvals.map(a => ({
      approvalRef: a.approvalRef,
      type: a.type,
      status: a.status,
      client: a.client,
      product: a.product?.name || a.investment?.product?.name,
      amount: a.amountKobo ? Number(a.amountKobo) / 100 : null,
      submittedAt: a.submittedAt,
      details: a.details,
    }));

    const totals = {
      totalPending: items.length,
      byType: this.groupBy(items, 'type'),
      totalAmount: items.filter(i => i.amount).reduce((s, i) => s + (i.amount || 0), 0),
    };

    return { items, totals };
  }

  private async getFinancialExceptionsReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const exceptions: any[] = [];

    // Failed transactions
    const failedTxns = await this.prisma.walletTransaction.findMany({
      where: {
        status: 'FAILED',
        ...this.buildDateFilter(dateFrom, dateTo, 'createdAt'),
        ...(clientId && { client: { clientRef: clientId } }),
      },
      include: { client: { select: { clientRef: true, name: true } } },
    });

    for (const tx of failedTxns) {
      exceptions.push({
        type: 'failed_transaction',
        severity: 'HIGH',
        ref: tx.txnRef,
        client: tx.client,
        amount: Number(tx.amountKobo) / 100,
        reason: tx.failureReason,
        createdAt: tx.createdAt,
      });
    }

    // Overdue loans
    const overdueLoans = await this.prisma.staffLoan.findMany({
      where: { status: 'OVERDUE', ...(clientId && { client: { clientRef: clientId } }) },
      include: { corporate: true, client: { select: { clientRef: true, name: true } } },
    });

    for (const loan of overdueLoans) {
      exceptions.push({
        type: 'overdue_loan',
        severity: 'HIGH',
        ref: loan.loanRef,
        corporate: loan.corporate?.name,
        client: loan.client,
        outstanding: Number(loan.outstandingKobo) / 100,
        overdueSince: loan.updatedAt,
      });
    }

    // Defaulted loans
    const defaultedLoans = await this.prisma.staffLoan.findMany({
      where: { status: 'DEFAULTED', ...(clientId && { client: { clientRef: clientId } }) },
      include: { corporate: true, client: { select: { clientRef: true, name: true } } },
    });

    for (const loan of defaultedLoans) {
      exceptions.push({
        type: 'defaulted_loan',
        severity: 'CRITICAL',
        ref: loan.loanRef,
        corporate: loan.corporate?.name,
        client: loan.client,
        outstanding: Number(loan.outstandingKobo) / 100,
        defaultedAt: loan.updatedAt,
      });
    }

    // Investments pending approval too long (> 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stuckApprovals = await this.prisma.approval.findMany({
      where: {
        status: 'PENDING',
        submittedAt: { lt: sevenDaysAgo },
        ...(clientId && { client: { clientRef: clientId } }),
      },
      include: { client: { select: { clientRef: true, name: true } }, product: true },
    });

    for (const approval of stuckApprovals) {
      exceptions.push({
        type: 'stuck_approval',
        severity: 'MEDIUM',
        ref: approval.approvalRef,
        client: approval.client,
        product: approval.product?.name,
        amount: approval.amountKobo ? Number(approval.amountKobo) / 100 : null,
        submittedAt: approval.submittedAt,
        daysPending: Math.floor((Date.now() - approval.submittedAt.getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    // Investments maturing soon without notification sent
    const soonMaturing = await this.prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        maturityDate: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        isInternal: false,
        ...(clientId && { client: { clientRef: clientId } }),
      },
      include: { client: { select: { clientRef: true, name: true } }, product: true },
    });

    for (const inv of soonMaturing) {
      exceptions.push({
        type: 'maturing_soon',
        severity: 'LOW',
        ref: inv.investRef,
        client: inv.client,
        product: inv.product?.name,
        maturityDate: inv.maturityDate,
        daysLeft: Math.ceil((inv.maturityDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      });
    }

    return {
      items: exceptions.sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
      }),
      totals: {
        critical: exceptions.filter(e => e.severity === 'CRITICAL').length,
        high: exceptions.filter(e => e.severity === 'HIGH').length,
        medium: exceptions.filter(e => e.severity === 'MEDIUM').length,
        low: exceptions.filter(e => e.severity === 'LOW').length,
      },
    };
  }

  private async getReversalsReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    const where: any = {
      type: 'WALLET_WITHDRAWAL', // reversals are typically withdrawals
      status: 'REVERSED',
      ...this.buildDateFilter(dateFrom, dateTo, 'createdAt'),
    };
    if (clientId) where.client = { clientRef: clientId };

    const reversals = await this.prisma.walletTransaction.findMany({
      where,
      include: {
        client: { select: { clientRef: true, name: true, email: true } },
        relatedTransaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = reversals.map(r => ({
      reversalRef: r.txnRef,
      originalRef: r.relatedTransaction?.txnRef || 'N/A',
      client: r.client,
      amount: Number(r.amountKobo) / 100,
      reason: r.failureReason || r.description,
      reversedAt: r.processedAt || r.createdAt,
    }));

    return { items, totals: { totalReversed: items.reduce((s, i) => s + i.amount, 0), count: items.length } };
  }

  private async getAdjustmentsReport(dateFrom?: Date, dateTo?: Date, clientId?: string) {
    // Adjustments are transactions that have a related transaction (reversal pair)
    const where: any = {
      relatedTransactionId: { not: null },
      status: { in: ['SUCCESSFUL', 'FAILED'] },
      ...this.buildDateFilter(dateFrom, dateTo, 'createdAt'),
    };
    if (clientId) where.client = { clientRef: clientId };

    const adjustments = await this.prisma.walletTransaction.findMany({
      where,
      include: {
        client: { select: { clientRef: true, name: true, email: true } },
        relatedTransaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = adjustments.map(a => ({
      adjustmentRef: a.txnRef,
      originalRef: a.relatedTransaction?.txnRef || 'N/A',
      client: a.client,
      originalAmount: a.relatedTransaction ? Number(a.relatedTransaction.amountKobo) / 100 : 0,
      adjustedAmount: Number(a.amountKobo) / 100,
      difference: Number(a.amountKobo) / 100 - (a.relatedTransaction ? Number(a.relatedTransaction.amountKobo) / 100 : 0),
      reason: a.description,
      adjustedAt: a.createdAt,
    }));

    return { items, totals: { totalAdjustments: items.length, netDifference: items.reduce((s, i) => s + i.difference, 0) } };
  }

  /**
   * Generate a PDF report from the report data
   */
  async generatePdf(report: any): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.3, 841.9]); // A4
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const margin = 40;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    const darkBlue = rgb(0.05, 0.1, 0.2);
    const mediumBlue = rgb(0.1, 0.2, 0.35);
    const gold = rgb(0.8, 0.65, 0.15);
    const darkGray = rgb(0.2, 0.2, 0.2);
    const mediumGray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.85, 0.85, 0.85);
    const white = rgb(1, 1, 1);

    const drawText = (text: string, x: number, yPos: number, size: number, fontToUse = font, color = darkGray, options: any = {}) => {
      page.drawText(text, { x, y: yPos, size, font: fontToUse, color, ...options });
    };

    const drawCenteredText = (text: string, yPos: number, size: number, fontToUse = font, color = darkGray) => {
      const textWidth = fontToUse.widthOfTextAtSize(text, size);
      drawText(text, (width - textWidth) / 2, yPos, size, fontToUse, color);
    };

    const drawRightText = (text: string, x: number, yPos: number, size: number, fontToUse = font, color = darkGray) => {
      const textWidth = fontToUse.widthOfTextAtSize(text, size);
      drawText(text, x - textWidth, yPos, size, fontToUse, color);
    };

    // Header background
    page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: darkBlue });

    // Company name
    y = height - 45;
    drawCenteredText(this.companyConfig.name.toUpperCase(), y, 22, fontBold, white);

    // Address
    y -= 20;
    drawCenteredText(this.companyConfig.address, y, 9, font, rgb(0.7, 0.8, 0.9));

    // Contact
    y -= 14;
    drawCenteredText(`${this.companyConfig.phone} | ${this.companyConfig.email}`, y, 9, font, rgb(0.65, 0.75, 0.9));

    // Divider
    y = height - 115;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.5, color: gold });

    // Report title
    y -= 25;
    drawCenteredText(report.title, y, 16, fontBold, darkBlue);

    // Report subtitle
    y -= 20;
    drawCenteredText(report.description, y, 10, fontOblique, mediumGray);

    // Report metadata
    y -= 25;
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    drawText(`Report Type: ${report.type}`, margin, y, 9, font, mediumGray);
    drawText(`Generated: ${new Date(report.generatedAt).toLocaleString('en-GB')}`, margin + 200, y, 9, font, mediumGray);
    y -= 18;
    drawText(`Date Range: ${formatDate(report.dateRange?.from)} to ${formatDate(report.dateRange?.to)}`, margin, y, 9, font, mediumGray);
    drawText(`Generated By: ${report.generatedByRole || 'Admin'} (${report.generatedBy || 'N/A'})`, margin + 200, y, 9, font, mediumGray);
    y -= 18;
    drawText(`Filters: ${JSON.stringify(report.filters)}`, margin, y, 9, font, mediumGray);

    // Divider
    y -= 20;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: gold });

    // Render report data based on type
    y -= 20;
    await this.renderReportData(page, report, margin, y, font, fontBold, fontOblique, contentWidth, darkGray, darkBlue, gold, white);

    // Footer
    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const p = pdfDoc.getPage(i);
      drawCenteredText(`Prodigy Finance — Confidential — Page ${i + 1} of ${pageCount}`, 20, 7, fontOblique, mediumGray);
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  private async renderReportData(page: any, report: any, margin: number, startY: number, font: any, fontBold: any, fontOblique: any, contentWidth: number, darkGray: any, darkBlue: any, gold: any, white: any) {
    let y = startY;
    const { type, data } = report;

    const drawText = (text: string, x: number, yPos: number, size: number, fontToUse = font, color = darkGray) => {
      page.drawText(text, { x, y: yPos, size, font: fontToUse, color });
    };

    const drawTableHeader = (headers: string[], colWidths: number[], x: number, yPos: number) => {
      let colX = x;
      page.drawRectangle({ x, y: yPos - 2, width: colWidths.reduce((a, b) => a + b, 0), height: 20, color: rgb(0.05, 0.1, 0.2) });
      headers.forEach((h, i) => {
        drawText(h, colX + 4, yPos + 4, 8, fontBold, white);
        colX += colWidths[i];
      });
      return yPos - 22;
    };

    const drawTableRow = (values: string[], colWidths: number[], x: number, yPos: number, rowIndex: number) => {
      let colX = x;
      if (rowIndex % 2 === 0) {
        page.drawRectangle({ x, y: yPos - 2, width: colWidths.reduce((a, b) => a + b, 0), height: 18, color: rgb(0.95, 0.95, 0.98) });
      }
      values.forEach((v, i) => {
        drawText(v, colX + 4, yPos + 2, 8, font, darkGray);
        colX += colWidths[i];
      });
      return yPos - 20;
    };

    switch (type) {
      case 'investment_summary': {
        const { items, totals } = data;
        const headers = ['Investment Ref', 'Client', 'Product', 'Principal', 'ROI', 'Tenor', 'Value Date', 'Maturity', 'Status', 'Expected Payout'];
        const colWidths = [70, 80, 80, 70, 45, 50, 65, 65, 55, 70];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 40); i++) {
          const inv = items[i];
          y = drawTableRow([
            inv.investRef,
            inv.client?.name?.slice(0, 20) || 'N/A',
            inv.product?.slice(0, 20) || 'N/A',
            `₦${inv.principal.toLocaleString()}`,
            `${inv.roiRate}%`,
            `${inv.tenorDays}d`,
            inv.valueDate ? new Date(inv.valueDate).toLocaleDateString('en-GB') : 'N/A',
            inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString('en-GB') : 'N/A',
            inv.status,
            `₦${inv.expectedPayout.toLocaleString()}`,
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        // Totals row
        y -= 5;
        drawText(`Total Principal: ₦${totals.totalPrincipal.toLocaleString()}`, margin, y, 9, fontBold, darkBlue);
        y -= 15;
        drawText(`Total Expected Payout: ₦${totals.totalExpectedPayout.toLocaleString()}`, margin, y, 9, fontBold, darkBlue);
        break;
      }
      case 'transaction_ledger': {
        const { items, totals } = data;
        const headers = ['Date', 'Ref', 'Client', 'Type', 'Status', 'Amount', 'Approved', 'Disbursed', 'Description'];
        const colWidths = [65, 60, 80, 65, 55, 65, 65, 65, 100];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 40); i++) {
          const tx = items[i];
          y = drawTableRow([
            tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB') : 'N/A',
            tx.txnRef?.slice(0, 15) || 'N/A',
            tx.client?.name?.slice(0, 20) || 'N/A',
            tx.type,
            tx.status,
            `₦${tx.amount.toLocaleString()}`,
            tx.approvedAmount ? `₦${tx.approvedAmount.toLocaleString()}` : 'N/A',
            tx.disbursedAmount ? `₦${tx.disbursedAmount.toLocaleString()}` : 'N/A',
            tx.description?.slice(0, 30) || 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'client_portfolio': {
        const { items } = data;
        const headers = ['Client Ref', 'Name', 'Type', 'Status', 'Wallet Bal', 'KYC', 'Total Inv', 'Active', 'Matured', 'Pending', 'Total Principal'];
        const colWidths = [70, 90, 55, 55, 65, 60, 55, 50, 55, 50, 70];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 30); i++) {
          const p = items[i];
          y = drawTableRow([
            p.client.clientRef,
            p.client.name?.slice(0, 25) || 'N/A',
            p.client.type,
            p.client.status,
            `₦${p.client.walletBalance.toLocaleString()}`,
            p.client.kycStatus,
            p.investments.total,
            p.investments.active,
            p.investments.matured,
            p.investments.pending,
            `₦${p.investments.totalPrincipal.toLocaleString()}`,
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'dividend_report': {
        const { items, totals } = data;
        const headers = ['Dividend Ref', 'Product', 'Rate', 'Total Payout', 'Eligible', 'Declared', 'Paid', 'Status'];
        const colWidths = [85, 80, 50, 80, 50, 70, 70, 60];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const d = items[i];
          y = drawTableRow([
            d.dividendRef,
            d.product?.slice(0, 20) || 'N/A',
            `${d.rate}%`,
            `₦${d.totalPayout.toLocaleString()}`,
            d.eligibleCount,
            d.declarationDate ? new Date(d.declarationDate).toLocaleDateString('en-GB') : 'N/A',
            d.paymentDate ? new Date(d.paymentDate).toLocaleDateString('en-GB') : 'N/A',
            d.status,
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'maturity_schedule': {
        const { items, byStatus } = data;
        const headers = ['Investment Ref', 'Client', 'Product', 'Principal', 'ROI', 'Tenor', 'Value Date', 'Maturity', 'Status', 'Days Left', 'Expected Payout'];
        const colWidths = [75, 75, 70, 60, 45, 45, 60, 60, 55, 50, 70];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const inv = items[i];
          y = drawTableRow([
            inv.investRef,
            inv.client?.name?.slice(0, 20) || 'N/A',
            inv.product?.slice(0, 20) || 'N/A',
            `₦${inv.principal.toLocaleString()}`,
            `${inv.roiRate}%`,
            `${inv.tenorDays}d`,
            inv.valueDate ? new Date(inv.valueDate).toLocaleDateString('en-GB') : 'N/A',
            inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString('en-GB') : 'N/A',
            inv.status,
            inv.daysToMaturity !== null ? `${inv.daysToMaturity}d` : 'N/A',
            `₦${inv.expectedPayout.toLocaleString()}`,
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'withholding_tax': {
        const { items, totals } = data;
        const headers = ['WT Ref', 'Client', 'Investment', 'Product', 'Gross Interest', 'Tax Rate', 'Tax Amount', 'Net Interest', 'Collected'];
        const colWidths = [75, 80, 70, 70, 75, 55, 70, 75, 70];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const r = items[i];
          y = drawTableRow([
            r.wtRef,
            r.client?.name?.slice(0, 20) || 'N/A',
            r.investmentRef?.slice(0, 12) || 'N/A',
            r.product?.slice(0, 20) || 'N/A',
            `₦${r.grossInterest.toLocaleString()}`,
            `${r.taxRate}%`,
            `₦${r.taxAmount.toLocaleString()}`,
            `₦${r.netInterest.toLocaleString()}`,
            r.collectedAt ? new Date(r.collectedAt).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'loan_portfolio': {
        const { items, totals } = data;
        const headers = ['Loan Ref', 'Corporate', 'Client', 'Staff', 'Principal', 'Rate', 'Tenor', 'Monthly', 'Status', 'Outstanding', 'Paid'];
        const colWidths = [70, 70, 70, 70, 65, 45, 50, 60, 55, 70, 65];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const l = items[i];
          y = drawTableRow([
            l.loanRef,
            l.corporate?.slice(0, 18) || 'N/A',
            l.client?.name?.slice(0, 18) || 'N/A',
            l.staffName?.slice(0, 18) || 'N/A',
            `₦${l.principal.toLocaleString()}`,
            `${l.interestRate}%`,
            `${l.tenorMonths}m`,
            `₦${l.monthlyPayment.toLocaleString()}`,
            l.status,
            `₦${l.outstanding.toLocaleString()}`,
            `₦${l.totalPaid.toLocaleString()}`,
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'audit_trail': {
        const { items, totals } = data;
        const headers = ['Audit Ref', 'Admin', 'Action', 'Target', 'Category', 'IP', 'Date'];
        const colWidths = [80, 80, 100, 70, 80, 80, 75];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 40); i++) {
          const a = items[i];
          y = drawTableRow([
            a.auditRef?.slice(0, 15) || 'N/A',
            a.admin?.name?.slice(0, 20) || 'N/A',
            a.action?.slice(0, 25) || 'N/A',
            a.targetEntity?.slice(0, 15) || 'N/A',
            a.category,
            a.ipAddress || 'N/A',
            a.occurredAt ? new Date(a.occurredAt).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'outstanding_loans': {
        const { items, totals } = data;
        const headers = ['Loan Ref', 'Corporate', 'Client', 'Staff', 'Principal', 'Rate', 'Status', 'Outstanding', 'Paid', 'Overdue Since'];
        const colWidths = [70, 70, 70, 70, 65, 45, 55, 70, 65, 70];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const l = items[i];
          y = drawTableRow([
            l.loanRef,
            l.corporate?.slice(0, 18) || 'N/A',
            l.client?.name?.slice(0, 18) || 'N/A',
            l.staffName?.slice(0, 18) || 'N/A',
            `₦${l.principal.toLocaleString()}`,
            `${l.interestRate}%`,
            l.status,
            `₦${l.outstanding.toLocaleString()}`,
            `₦${l.totalPaid.toLocaleString()}`,
            l.overdueSince ? new Date(l.overdueSince).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'repayments': {
        const { items, totals } = data;
        const headers = ['Loan Ref', 'Corporate', 'Client', 'Staff', 'Amount', 'Date', 'Note'];
        const colWidths = [70, 70, 70, 70, 80, 80, 100];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 40); i++) {
          const r = items[i];
          y = drawTableRow([
            r.loanRef,
            r.corporate?.slice(0, 18) || 'N/A',
            r.client?.name?.slice(0, 18) || 'N/A',
            r.staffName?.slice(0, 18) || 'N/A',
            `₦${r.amount.toLocaleString()}`,
            r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-GB') : 'N/A',
            r.note || 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'pending_approvals': {
        const { items, totals } = data;
        const headers = ['Approval Ref', 'Type', 'Status', 'Client', 'Product', 'Amount', 'Submitted'];
        const colWidths = [85, 80, 60, 80, 90, 75, 80];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const a = items[i];
          y = drawTableRow([
            a.approvalRef,
            a.type,
            a.status,
            a.client?.name?.slice(0, 20) || 'N/A',
            a.product?.slice(0, 25) || 'N/A',
            a.amount ? `₦${a.amount.toLocaleString()}` : 'N/A',
            a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'financial_exceptions': {
        const { items, totals } = data;
        const headers = ['Type', 'Severity', 'Ref', 'Client', 'Amount', 'Reason', 'Date'];
        const colWidths = [100, 60, 80, 80, 80, 120, 75];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const e = items[i];
          y = drawTableRow([
            e.type,
            e.severity,
            e.ref,
            e.client?.name?.slice(0, 20) || e.corporate?.slice(0, 20) || 'N/A',
            e.amount ? `₦${e.amount.toLocaleString()}` : 'N/A',
            e.reason?.slice(0, 40) || e.daysPending ? `${e.daysPending} days` : 'N/A',
            e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-GB') : e.submittedAt ? new Date(e.submittedAt).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'reversals': {
        const { items, totals } = data;
        const headers = ['Reversal Ref', 'Original Ref', 'Client', 'Amount', 'Reason', 'Reversed At'];
        const colWidths = [90, 90, 80, 70, 100, 85];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const r = items[i];
          y = drawTableRow([
            r.reversalRef,
            r.originalRef,
            r.client?.name?.slice(0, 20) || 'N/A',
            `₦${r.amount.toLocaleString()}`,
            r.reason?.slice(0, 40) || 'N/A',
            r.reversedAt ? new Date(r.reversedAt).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
      case 'adjustments': {
        const { items, totals } = data;
        const headers = ['Adjustment Ref', 'Original Ref', 'Client', 'Original', 'Adjusted', 'Difference', 'Reason', 'Date'];
        const colWidths = [85, 85, 80, 70, 70, 70, 80, 75];
        y = drawTableHeader(headers, colWidths, margin, y);
        for (let i = 0; i < Math.min(items.length, 35); i++) {
          const a = items[i];
          y = drawTableRow([
            a.adjustmentRef,
            a.originalRef,
            a.client?.name?.slice(0, 20) || 'N/A',
            `₦${a.originalAmount.toLocaleString()}`,
            `₦${a.adjustedAmount.toLocaleString()}`,
            `₦${a.difference.toLocaleString()}`,
            a.reason?.slice(0, 30) || 'N/A',
            a.adjustedAt ? new Date(a.adjustedAt).toLocaleDateString('en-GB') : 'N/A',
          ], colWidths, margin, y, i);
          if (y < 80) break;
        }
        break;
      }
    }
  }
}