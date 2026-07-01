import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths } from 'date-fns';
import { logAdminAction } from '../common/audit/log-admin-action';

@Injectable()
export class StaffLoansService {
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

    return this.prisma.staffLoan.create({
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
      const result = await tx.staffLoan.update({
        where: { id: loanId },
        data: {
          status: 'ACTIVE',
          disbursedAt: now,
          maturityDate,
          outstandingKobo: BigInt(Math.round(totalRepay)),
        },
      });

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

    const updated = await this.prisma.staffLoan.update({
      where: { id: loanId },
      data: { status: 'REJECTED', rejectionReason: reason || 'Rejected by admin' },
    });

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
  async recordRepayment(loanId: string, amountKobo: bigint, note?: string, adminId?: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const loan = await this.prisma.staffLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Staff loan not found');
    if (loan.status !== 'ACTIVE') throw new BadRequestException('Can only record repayments on ACTIVE loans');

    const rawOutstanding = BigInt(loan.outstandingKobo);
    const amt            = BigInt(amountKobo);
    const newOutstanding = rawOutstanding - amt;
    const isFullyRepaid  = newOutstanding <= BigInt(0);
    const effectiveAmt   = isFullyRepaid ? rawOutstanding : amt; // don't overpay

    // Flat interest: compute interest earned from this payment
    const totalInterest   = Math.round(Number(loan.principalKobo) * Number(loan.interestRate) / 100);
    const alreadyEarned    = Number(loan.interestEarnedKobo || 0);
    const remainingInterest = Math.max(0, totalInterest - alreadyEarned);
    const interestPortion  = Math.min(remainingInterest, Number(effectiveAmt));
    const principalPortion = Number(effectiveAmt) - interestPortion;
    const newInterestEarned = alreadyEarned + interestPortion;

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
        // Debit corporate wallet
        await tx.client.update({
          where: { id: loan.clientId },
          data: { walletBalance: { decrement: effectiveAmt } },
        });

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
}
