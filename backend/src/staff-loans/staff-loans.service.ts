import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths } from 'date-fns';
import { logAdminAction } from '../common/audit/log-admin-action';

@Injectable()
export class StaffLoansService {
  private readonly logger = new Logger(StaffLoansService.name);
  constructor(private prisma: PrismaService) {}

  // Admin: get all corporate entities with their loans
  async getAllCorporateEntities() {
    return this.prisma.corporateEntity.findMany({
      include: {
        staffLoans: {
          include: { repayments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Admin: get staff loans for a specific entity
  async getEntityLoans(entityId: string) {
    const entity = await this.prisma.corporateEntity.findUnique({
      where: { id: entityId },
      include: {
        staffLoans: {
          include: { repayments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!entity) throw new NotFoundException('Corporate entity not found');
    return entity;
  }

  // Client (corporate): get own entity's staff loans
  async getMyEntityLoans(clientDbId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.staffLoan.findMany({
      where: { clientId: clientDbId },
      include: { repayments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Client (corporate): submit a new staff loan application
  async applyLoan(clientDbId: string, dto: {
    staffName: string;
    staffId?: string;
    staffEmail?: string;
    department?: string;
    amount: number;
    term: number;
    purpose?: string;
  }) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');

    // Find or create CorporateEntity linked to this client
    let entity = await this.prisma.corporateEntity.findFirst({ where: { clientId: clientDbId } });
    if (!entity) {
      const count = await this.prisma.corporateEntity.count();
      entity = await this.prisma.corporateEntity.create({
        data: {
          entityRef: `CE-${String(count + 1).padStart(4, '0')}`,
          name: client.name,
          clientId: clientDbId,
        },
      });
    }

    const principalKobo = BigInt(Math.round(dto.amount * 100));
    const interestRate  = 1.5;
    const totalRepay    = Number(principalKobo) * 1.015;
    const monthly       = BigInt(Math.round(totalRepay / dto.term));
    const loanRef       = `LN-${Date.now()}`;

    const loan = await this.prisma.staffLoan.create({
      data: {
        loanRef,
        corporateId:        entity.id,
        clientId:           clientDbId,
        staffName:          dto.staffName,
        staffId:            dto.staffId,
        staffEmail:         dto.staffEmail,
        department:         dto.department,
        principalKobo,
        interestRate,
        tenorMonths:        dto.term,
        monthlyPaymentKobo: monthly,
        outstandingKobo:    BigInt(0),
        status:             'PENDING',
      },
    });

    // Client-facing ActivityLog: loan application submitted
    await this.prisma.activityLog.create({
      data: {
        clientId: clientDbId,
        action: 'STAFF_LOAN_APPLICATION_SUBMITTED',
        description: `Staff loan application for ${dto.staffName} (₦${(Number(principalKobo) / 100).toLocaleString()}) submitted for approval`,
        amountKobo: principalKobo,
        metadata: { loanId: loan.id, loanRef, staffName: dto.staffName, termMonths: dto.term, interestRate } as any,
      },
    }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));

    return loan;
  }

  async findOne(id: string) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id },
      include: { corporate: true, repayments: true },
    });
    if (!loan) throw new NotFoundException('Staff loan not found');
    return loan;
  }

  // Admin: approve a pending staff loan — disburses to corporate wallet
  async approveLoan(loanId: string, adminId?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: { corporate: true },
    });
    if (!loan) throw new NotFoundException('Staff loan not found');
    if (loan.status !== 'PENDING') throw new BadRequestException('Only PENDING loans can be approved');

    const now = new Date();
    const maturityDate = addMonths(now, loan.tenorMonths);
    const totalRepay = Number(loan.principalKobo) * (1 + Number(loan.interestRate) / 100);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic claim — a concurrent second approve attempt must not double-disburse.
      const claimed = await tx.staffLoan.updateMany({
        where: { id: loanId, status: 'PENDING' },
        data: {
          status: 'ACTIVE',
          disbursedAt: now,
          maturityDate,
          outstandingKobo: BigInt(Math.round(totalRepay)),
        },
      });
      if (claimed.count === 0) {
        const current = await tx.staffLoan.findUnique({ where: { id: loanId } });
        if (!current) throw new NotFoundException('Staff loan not found');
        throw new BadRequestException(`This loan is already ${current.status.toLowerCase()} and cannot be approved again.`);
      }

      const result = await tx.staffLoan.findUnique({ where: { id: loanId } });

      if (loan.clientId) {
        // Credit corporate wallet
        await tx.client.update({
          where: { id: loan.clientId },
          data: { walletBalance: { increment: loan.principalKobo } },
        });

        // Wallet transaction log
        await tx.walletTransaction.create({
          data: {
            txnRef: `WAL-SLD-${Date.now()}`,
            clientId: loan.clientId,
            type: 'LOAN_DISBURSEMENT',
            status: 'SUCCESSFUL',
            amountKobo: loan.principalKobo,
            description: `Staff loan disbursement — ${loan.staffName} (${loan.loanRef})`,
            processedAt: now,
            initiatedById: adminId || '',
          },
        });
      }

      // Org ledger: loan disbursement (asset outflow)
      await tx.orgLedger.create({
        data: {
          entryRef: `ORG-SLD-${Date.now()}`,
          type: 'STAFF_LOAN_DISBURSEMENT',
          amountKobo: loan.principalKobo,
          clientId: loan.clientId || undefined,
          description: `Staff loan disbursement — ${loan.staffName} (${loan.loanRef})`,
          recordedById: adminId || undefined,
        },
      });

      return result;
    });

    // Client-facing ActivityLog: loan approved & disbursed
    if (loan.clientId) {
      await this.prisma.activityLog.create({
        data: {
          clientId: loan.clientId,
          action: 'STAFF_LOAN_APPROVED_DISBURSED',
          description: `Staff loan approved and disbursed — ${loan.staffName} (${loan.loanRef}) for ₦${(Number(loan.principalKobo) / 100).toLocaleString()}`,
          amountKobo: loan.principalKobo,
          metadata: { loanId, loanRef: loan.loanRef, staffName: loan.staffName, disbursedAt: now } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
    }

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'STAFF_LOAN_APPROVED_DISBURSED',
      targetEntity: loanId,
      category: 'FINANCE',
      metadata: { staffName: loan.staffName, loanRef: loan.loanRef, principalKobo: Number(loan.principalKobo), clientId: loan.clientId },
    });

    return updated;
  }

  // Admin: reject a pending staff loan
  async rejectLoan(loanId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const loan = await this.prisma.staffLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Staff loan not found');
    if (loan.status !== 'PENDING') throw new BadRequestException('Only PENDING loans can be rejected');

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic claim — a second reject (or approve) attempt must fail safely.
      const claimed = await tx.staffLoan.updateMany({
        where: { id: loanId, status: 'PENDING' },
        data: { status: 'REJECTED', rejectionReason: reason || 'Rejected by admin' },
      });
      if (claimed.count === 0) {
        const current = await tx.staffLoan.findUnique({ where: { id: loanId } });
        if (!current) throw new NotFoundException('Staff loan not found');
        throw new BadRequestException(`This loan is already ${current.status.toLowerCase()} and cannot be rejected again.`);
      }
      return tx.staffLoan.findUnique({ where: { id: loanId } });
    });

    // Client-facing ActivityLog: loan rejected
    if (loan.clientId) {
      await this.prisma.activityLog.create({
        data: {
          clientId: loan.clientId,
          action: 'STAFF_LOAN_REJECTED',
          description: `Staff loan application rejected — ${loan.staffName} (${loan.loanRef})`,
          amountKobo: loan.principalKobo,
          metadata: { loanId, loanRef: loan.loanRef, staffName: loan.staffName, reason } as any,
        },
      }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
    }

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'STAFF_LOAN_REJECTED',
      targetEntity: loanId,
      category: 'FINANCE',
      metadata: { staffName: loan.staffName, loanRef: loan.loanRef, reason },
    });

    return updated;
  }

  // Admin: record a loan repayment (monthly salary deduction)
  async recordRepayment(loanId: string, amountKobo: number | bigint, note?: string, adminId?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const loan = await this.prisma.staffLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Staff loan not found');
    if (loan.status !== 'ACTIVE') throw new BadRequestException('Can only record repayments on ACTIVE loans');

    // Strict repayment validation — repayments must be positive, whole, and
    // never exceed the outstanding balance. A negative/zero/invalid value must
    // never reach the ledger (it would otherwise mint wallet balance).
    const amt = this.parseRepaymentKobo(amountKobo);
    const rawOutstanding = BigInt(loan.outstandingKobo);
    if (amt > rawOutstanding) {
      throw new BadRequestException('Repayment amount exceeds the outstanding loan balance.');
    }
    const effectiveAmt = amt; // guaranteed <= outstanding, > 0

    // Flat interest: compute interest earned from this payment
    const totalInterest   = Math.round(Number(loan.principalKobo) * Number(loan.interestRate) / 100);
    const alreadyEarned    = Number(loan.interestEarnedKobo || 0);
    const remainingInterest = Math.max(0, totalInterest - alreadyEarned);
    const interestPortion  = Math.min(remainingInterest, Number(effectiveAmt));
    const principalPortion = Number(effectiveAmt) - interestPortion;
    const newInterestEarned = alreadyEarned + interestPortion;
    const isFullyRepaid    = effectiveAmt === rawOutstanding;
    const newOutstanding   = rawOutstanding - effectiveAmt;

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.loanRepayment.create({
        data: { loanId, amountKobo: effectiveAmt, note: note || `Principal: ${principalPortion}, Interest: ${interestPortion}` },
      });

      const updated = await tx.staffLoan.update({
        where: { id: loanId },
        data: {
          outstandingKobo: isFullyRepaid ? BigInt(0) : newOutstanding,
          interestEarnedKobo: BigInt(newInterestEarned),
          status: isFullyRepaid ? 'REPAID' : 'ACTIVE',
        },
      });

      if (loan.clientId) {
        // Debit corporate wallet — atomic guard prevents overspending and
        // guarantees walletBalance can never go negative from a repayment.
        const debited = await tx.client.updateMany({
          where: { id: loan.clientId, walletBalance: { gte: effectiveAmt } },
          data: { walletBalance: { decrement: effectiveAmt } },
        });
        if (debited.count === 0) {
          throw new BadRequestException('Corporate wallet balance is insufficient for this repayment.');
        }

        // Wallet transaction log
        await tx.walletTransaction.create({
          data: {
            txnRef: `WAL-SLR-${Date.now()}`,
            clientId: loan.clientId,
            type: 'LOAN_REPAYMENT',
            status: 'SUCCESSFUL',
            amountKobo: effectiveAmt,
            description: `Staff loan repayment — ${loan.staffName} (${loan.loanRef}) · Interest: ₦${(interestPortion / 100).toLocaleString()}`,
            processedAt: now,
            initiatedById: adminId || '',
          },
        });
      }

      // Org ledger: principal repayment (return of capital)
      if (principalPortion > 0) {
        await tx.orgLedger.create({
          data: {
            entryRef: `ORG-SLR-P-${Date.now()}`,
            type: 'STAFF_LOAN_PRINCIPAL_REPAYMENT',
            amountKobo: BigInt(principalPortion),
            clientId: loan.clientId || undefined,
            description: `Principal repayment — ${loan.staffName} (${loan.loanRef})`,
            recordedById: adminId || undefined,
          },
        });
      }

      // Org ledger: interest income
      if (interestPortion > 0) {
        await tx.orgLedger.create({
          data: {
            entryRef: `ORG-SLR-I-${Date.now()}`,
            type: 'STAFF_LOAN_INTEREST_INCOME',
            amountKobo: BigInt(interestPortion),
            clientId: loan.clientId || undefined,
            description: `Interest income — ${loan.staffName} (${loan.loanRef})`,
            recordedById: adminId || undefined,
          },
        });
      }

      // Client-facing ActivityLog: loan repayment recorded
      if (loan.clientId) {
        await tx.activityLog.create({
          data: {
            clientId: loan.clientId,
            action: 'STAFF_LOAN_REPAYMENT_RECORDED',
            description: `Staff loan repayment for ${loan.staffName} (${loan.loanRef}) — ₦${(Number(effectiveAmt) / 100).toLocaleString()} (Principal: ₦${(principalPortion / 100).toLocaleString()}, Interest: ₦${(interestPortion / 100).toLocaleString()})`,
            amountKobo: effectiveAmt,
            metadata: { loanId, loanRef: loan.loanRef, staffName: loan.staffName, principalPortion, interestPortion, isFullyRepaid } as any,
          },
        }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
      }

      return updated;
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'STAFF_LOAN_REPAYMENT_RECORDED',
      targetEntity: loanId,
      category: 'FINANCE',
      metadata: { staffName: loan.staffName, loanRef: loan.loanRef, amountKobo: Number(effectiveAmt), isFullyRepaid },
    });

    return result;
  }

  /** Validate a repayment amount: must be a positive whole number of kobo. */
  private parseRepaymentKobo(value: unknown): bigint {
    if (typeof value === 'bigint') {
      if (value <= BigInt(0)) throw new BadRequestException('Repayment amount must be greater than zero.');
      return value;
    }
    const n = Number(value);
    if (value === undefined || value === null || !Number.isFinite(n)) {
      throw new BadRequestException('Repayment amount must be a valid number.');
    }
    if (!Number.isInteger(n)) {
      throw new BadRequestException('Repayment amount must be a whole number of kobo.');
    }
    if (n <= 0) {
      throw new BadRequestException('Repayment amount must be greater than zero.');
    }
    return BigInt(n);
  }

  // ════════════════════════════════════════════════════════════════════
  // LOAN LIFECYCLE MANAGEMENT
  // ════════════════════════════════════════════════════════════════════

  /**
   * Check and update overdue loans. Should be run periodically (e.g., daily cron).
   * Marks ACTIVE loans as OVERDUE if past maturity date with outstanding balance.
   */
  async checkOverdueLoans(adminId?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const now = new Date();
    const overdueLoans = await this.prisma.staffLoan.findMany({
      where: {
        status: 'ACTIVE',
        maturityDate: { lt: now },
        outstandingKobo: { gt: 0 },
      },
      include: { corporate: true, client: true },
    });

    const results: Array<{
      id: string;
      status: string;
      [key: string]: any;
    }> = [];
    for (const loan of overdueLoans) {
      const updatedLoan = await this.prisma.$transaction(async (tx) => {
        const updatedLoan = await tx.staffLoan.update({
          where: { id: loan.id },
          data: { status: 'OVERDUE' },
        });

        // Create activity log
        if (loan.clientId) {
          await tx.activityLog.create({
            data: {
              clientId: loan.clientId,
              action: 'STAFF_LOAN_OVERDUE',
              description: `Staff loan ${loan.loanRef} for ${loan.staffName} is now overdue (maturity: ${loan.maturityDate?.toISOString().split('T')[0]})`,
              amountKobo: loan.outstandingKobo,
              metadata: { loanId: loan.id, loanRef: loan.loanRef, staffName: loan.staffName, maturityDate: loan.maturityDate } as any,
            },
          }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
        }

        return updatedLoan;
      });

      // Audit log
      await logAdminAction(this.prisma, {
        adminId: admin?.adminUserId ?? adminId,
        adminRole: admin?.adminRole ?? 'system',
        action: 'STAFF_LOAN_MARKED_OVERDUE',
        targetEntity: loan.id,
        category: 'FINANCE',
        metadata: { staffName: loan.staffName, loanRef: loan.loanRef, maturityDate: loan.maturityDate, outstandingKobo: Number(loan.outstandingKobo) },
      });

      results.push(updatedLoan);
    }

    return results;
  }

  /**
   * Get loan repayment schedule with calculated due dates and amounts.
   */
  async getRepaymentSchedule(loanId: string) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: { repayments: { orderBy: { paidAt: 'asc' } }, corporate: true },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    const startDate = loan.disbursedAt || loan.createdAt;
    const monthlyPayment = Number(loan.monthlyPaymentKobo) / 100;
    const totalMonths = loan.tenorMonths;

    const schedule: Array<{
      installmentNumber: number;
      dueDate: string;
      dueAmountNaira: number;
      status: string;
      paidAt: string | null;
      paidAmountNaira: number;
    }> = [];
    for (let i = 1; i <= totalMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const dueMonth = dueDate.getMonth();
      const dueYear = dueDate.getFullYear();
      const isOverdue = dueDate < new Date();

      const existingRepayment = loan.repayments.find(r => {
        const paidMonth = new Date(r.paidAt).getMonth();
        const paidYear = new Date(r.paidAt).getFullYear();
        return paidMonth === dueMonth && paidYear === dueYear;
      });

      const entry = {
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        dueAmountNaira: monthlyPayment,
        status: existingRepayment ? 'PAID' : (isOverdue ? 'OVERDUE' : 'PENDING'),
        paidAt: existingRepayment && existingRepayment.paidAt ? existingRepayment.paidAt.toISOString().split('T')[0] : null,
        paidAmountNaira: existingRepayment ? Number(existingRepayment.amountKobo) / 100 : 0,
      };
      schedule.push(entry);
    }

    return {
      loanId: loan.id,
      loanRef: loan.loanRef,
      staffName: loan.staffName,
      principalNaira: Number(loan.principalKobo) / 100,
      interestRate: Number(loan.interestRate),
      tenorMonths: loan.tenorMonths,
      monthlyPaymentNaira: monthlyPayment,
      totalRepaymentNaira: monthlyPayment * totalMonths,
      outstandingNaira: Number(loan.outstandingKobo) / 100,
      interestEarnedNaira: Number(loan.interestEarnedKobo || 0) / 100,
      status: loan.status,
      schedule,
    };
  }

  /**
   * Restructure an existing loan (extend tenor, adjust payment, etc.).
   * Creates a new loan linked to the original, marks original as RESTRUCTURED.
   */
  async restructureLoan(
    loanId: string,
    adminId: string,
    dto: { newTenorMonths: number; newInterestRate?: number; reason: string },
    admin?: { adminUserId?: string | null; adminRole?: string | null },
  ) {
    const originalLoan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: { corporate: true, client: true },
    });
    if (!originalLoan) throw new NotFoundException('Loan not found');

    if (!['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(originalLoan.status)) {
      throw new BadRequestException(`Cannot restructure loan in ${originalLoan.status} status.`);
    }

    if (dto.newTenorMonths <= 0) {
      throw new BadRequestException('New tenor must be greater than zero.');
    }

    const newInterestRate = dto.newInterestRate ?? Number(originalLoan.interestRate);
    if (newInterestRate < 0) {
      throw new BadRequestException('Interest rate cannot be negative.');
    }

    const adminName = await this.resolveAdminName(adminId);
    const newLoanRef = `LN-R-${Date.now()}`;
    const now = new Date();
    const newMaturityDate = new Date(now);
    newMaturityDate.setMonth(newMaturityDate.getMonth() + dto.newTenorMonths);

    // Calculate new monthly payment
    const remainingPrincipal = Number(originalLoan.outstandingKobo);
    const totalRepay = remainingPrincipal * (1 + newInterestRate / 100);
    const newMonthlyPaymentKobo = BigInt(Math.round(totalRepay / dto.newTenorMonths));

    const newLoan = await this.prisma.$transaction(async (tx) => {
      // Mark original as RESTRUCTURED
      await tx.staffLoan.update({
        where: { id: originalLoan.id },
        data: { status: 'RESTRUCTURED' },
      });

      // Create new restructured loan
      const restructuredLoan = await tx.staffLoan.create({
        data: {
          loanRef: newLoanRef,
          corporateId: originalLoan.corporateId,
          clientId: originalLoan.clientId,
          staffName: originalLoan.staffName,
          staffId: originalLoan.staffId,
          staffEmail: originalLoan.staffEmail,
          department: originalLoan.department,
          principalKobo: originalLoan.outstandingKobo, // Remaining balance becomes new principal
          interestRate: newInterestRate,
          tenorMonths: dto.newTenorMonths,
          monthlyPaymentKobo: newMonthlyPaymentKobo,
          outstandingKobo: BigInt(Math.round(totalRepay)),
          status: 'ACTIVE',
          disbursedAt: now,
          maturityDate: newMaturityDate,
        },
      });

      // Activity log for original loan
      if (originalLoan.clientId) {
        await tx.activityLog.create({
          data: {
            clientId: originalLoan.clientId,
            action: 'STAFF_LOAN_RESTRUCTURED',
            description: `Staff loan ${originalLoan.loanRef} restructured into ${newLoanRef}. New tenor: ${dto.newTenorMonths} months, rate: ${newInterestRate}%`,
            amountKobo: originalLoan.outstandingKobo,
            metadata: { originalLoanId: originalLoan.id, originalLoanRef: originalLoan.loanRef, newLoanId: restructuredLoan.id, newLoanRef, newTenorMonths: dto.newTenorMonths, newInterestRate, reason: dto.reason } as any,
          },
        }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
      }

      return restructuredLoan;
    });

    // Audit log
    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'STAFF_LOAN_RESTRUCTURED',
      targetEntity: originalLoan.id,
      category: 'FINANCE',
      metadata: {
        originalLoanRef: originalLoan.loanRef,
        newLoanRef,
        staffName: originalLoan.staffName,
        newTenorMonths: dto.newTenorMonths,
        newInterestRate,
        reason: dto.reason,
        originalOutstanding: Number(originalLoan.outstandingKobo),
      },
    });

    return newLoan;
  }

  /**
   * Get detailed loan calculation breakdown.
   */
  async getLoanCalculationDetails(loanId: string) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: { repayments: { orderBy: { paidAt: 'asc' } }, corporate: true },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    const principalNaira = Number(loan.principalKobo) / 100;
    const interestRate = Number(loan.interestRate);
    const totalInterest = Math.round(principalNaira * interestRate / 100);
    const totalRepayment = principalNaira + totalInterest;
    const monthlyPayment = Number(loan.monthlyPaymentKobo) / 100;
    const paidPrincipal = loan.repayments.reduce((sum, r) => sum + Number(r.amountKobo), 0);
    const paidInterest = Math.min(totalInterest, paidPrincipal); // Simplified: interest paid first
    const paidPrincipalActual = Math.max(0, paidPrincipal - totalInterest);
    const outstandingPrincipal = principalNaira - paidPrincipalActual;
    const outstandingInterest = totalInterest - paidInterest;
    const outstandingTotal = outstandingPrincipal + outstandingInterest;

    return {
      loanId: loan.id,
      loanRef: loan.loanRef,
      staffName: loan.staffName,
      // Original terms
      originalPrincipalNaira: principalNaira,
      interestRate,
      tenorMonths: loan.tenorMonths,
      monthlyPaymentNaira: monthlyPayment,
      totalInterestNaira: totalInterest,
      totalRepaymentNaira: totalRepayment,
      // Disbursement info
      disbursedAt: loan.disbursedAt?.toISOString().split('T')[0],
      maturityDate: loan.maturityDate?.toISOString().split('T')[0],
      // Repayment summary
      totalPaidNaira: paidPrincipal / 100,
      paidPrincipalNaira: paidPrincipalActual / 100,
      paidInterestNaira: paidInterest / 100,
      // Outstanding
      outstandingPrincipalNaira: outstandingPrincipal,
      outstandingInterestNaira: outstandingInterest,
      outstandingTotalNaira: outstandingTotal,
      // Status
      status: loan.status,
      interestEarnedNaira: Number(loan.interestEarnedKobo || 0) / 100,
      // Repayment history
      repaymentHistory: loan.repayments.map(r => ({
        paidAt: r.paidAt.toISOString().split('T')[0],
        amountNaira: Number(r.amountKobo) / 100,
        note: r.note,
      })),
    };
  }

  /**
   * Mark loan as DEFAULTED (admin action).
   */
  async markLoanDefaulted(loanId: string, adminId: string, reason: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: { corporate: true, client: true },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status === 'REPAID' || loan.status === 'RESTRUCTURED') {
      throw new BadRequestException(`Cannot mark ${loan.status} loan as defaulted.`);
    }

    const adminName = await this.resolveAdminName(adminId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.staffLoan.update({
        where: { id: loanId },
        data: { status: 'DEFAULTED', rejectionReason: reason },
      });

      // Activity log
      if (loan.clientId) {
        await tx.activityLog.create({
          data: {
            clientId: loan.clientId,
            action: 'STAFF_LOAN_DEFAULTED',
            description: `Staff loan ${loan.loanRef} for ${loan.staffName} marked as DEFAULTED: ${reason}`,
            amountKobo: loan.outstandingKobo,
            metadata: { loanId: loan.id, loanRef: loan.loanRef, staffName: loan.staffName, reason } as any,
          },
        }).catch((err) => this.logger.warn(`ActivityLog write failed: ${err.message}`));
      }

      return updatedLoan;
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'STAFF_LOAN_DEFAULTED',
      targetEntity: loanId,
      category: 'FINANCE',
      metadata: { staffName: loan.staffName, loanRef: loan.loanRef, reason, outstandingKobo: Number(loan.outstandingKobo) },
    });

    return updated;
  }

  /** Look up an admin's display name for audit/ledger descriptions, with a safe fallback. */
  private async resolveAdminName(adminId?: string | null): Promise<string> {
    if (!adminId) return 'Unknown Admin';
    try {
      const adminUser = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
      return adminUser?.name || 'Unknown Admin';
    } catch {
      return 'Unknown Admin';
    }
  }
}
