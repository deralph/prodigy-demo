import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StaffLoansService } from './staff-loans.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS } from '../../test/helpers/mock-prisma';

const ACTIVE_LOAN = {
  id: 'loan-1',
  loanRef: 'LN-1001',
  clientId: IDS.CLIENT_DB,
  corporateId: 'ce-1',
  staffName: 'Ada Lovelace',
  principalKobo: BigInt(200_000_00),
  interestRate: 1.5,
  tenorMonths: 6,
  outstandingKobo: BigInt(203_000_00),
  interestEarnedKobo: BigInt(0),
  status: 'ACTIVE',
};

describe('StaffLoansService', () => {
  let service: StaffLoansService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StaffLoansService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(StaffLoansService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── approveLoan ──────────────────────────────────────────────────
  describe('approveLoan()', () => {
    const pendingLoan = { ...ACTIVE_LOAN, status: 'PENDING', outstandingKobo: BigInt(0) };

    it('disburses the loan via an atomic claim and writes ledger + wallet txn', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(pendingLoan as any);
      prisma.staffLoan.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.staffLoan.findUnique.mockResolvedValueOnce({ ...pendingLoan, status: 'ACTIVE', clientId: IDS.CLIENT_DB } as any);
      prisma.client.update.mockResolvedValueOnce({} as any);
      prisma.walletTransaction.create.mockResolvedValueOnce({} as any);
      prisma.orgLedger.create.mockResolvedValueOnce({} as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.approveLoan('loan-1', IDS.ADMIN_USER, { adminUserId: IDS.ADMIN_USER, adminRole: 'SUPER_ADMIN' });
      expect(prisma.staffLoan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loan-1', status: 'PENDING' },
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { walletBalance: { increment: pendingLoan.principalKobo } } }),
      );
      expect(prisma.orgLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'STAFF_LOAN_DISBURSEMENT' }) }),
      );
      expect((result as any).status).toBe('ACTIVE');
    });

    it('throws BadRequestException when a concurrent approve already claimed the loan (no double disbursement)', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(pendingLoan as any);
      prisma.staffLoan.updateMany.mockResolvedValueOnce({ count: 0 } as any);
      prisma.staffLoan.findUnique.mockResolvedValueOnce({ ...pendingLoan, status: 'ACTIVE' } as any);

      await expect(service.approveLoan('loan-1', IDS.ADMIN_USER)).rejects.toThrow(BadRequestException);
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the loan does not exist', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(null);
      await expect(service.approveLoan('missing', IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });
  });

  // ── rejectLoan ───────────────────────────────────────────────────
  describe('rejectLoan()', () => {
    const pendingLoan = { ...ACTIVE_LOAN, status: 'PENDING' };

    it('rejects a pending loan with an atomic claim', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(pendingLoan as any);
      prisma.staffLoan.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.staffLoan.findUnique.mockResolvedValueOnce({ ...pendingLoan, status: 'REJECTED', rejectionReason: 'Incomplete docs', clientId: IDS.CLIENT_DB } as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.rejectLoan('loan-1', 'Incomplete docs');
      expect(prisma.staffLoan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loan-1', status: 'PENDING' },
          data: expect.objectContaining({ status: 'REJECTED', rejectionReason: 'Incomplete docs' }),
        }),
      );
      expect((result as any).status).toBe('REJECTED');
    });

    it('throws BadRequestException when already processed', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(pendingLoan as any);
      prisma.staffLoan.updateMany.mockResolvedValueOnce({ count: 0 } as any);
      prisma.staffLoan.findUnique.mockResolvedValueOnce({ ...pendingLoan, status: 'REJECTED' } as any);

      await expect(service.rejectLoan('loan-1', 'reason')).rejects.toThrow(BadRequestException);
    });
  });

  // ── recordRepayment ──────────────────────────────────────────────
  describe('recordRepayment()', () => {
    it('throws for a zero or negative repayment amount', async () => {
      prisma.staffLoan.findUnique.mockResolvedValue(ACTIVE_LOAN as any);
      await expect(service.recordRepayment('loan-1', BigInt(0))).rejects.toThrow(BadRequestException);
      await expect(service.recordRepayment('loan-1', BigInt(-500))).rejects.toThrow(BadRequestException);
    });

    it('throws for a non-whole (decimal kobo) amount', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(ACTIVE_LOAN as any);
      await expect(service.recordRepayment('loan-1', 100.5 as any)).rejects.toThrow(BadRequestException);
    });

    it('throws when the repayment exceeds the outstanding balance', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(ACTIVE_LOAN as any);
      await expect(service.recordRepayment('loan-1', BigInt(999_999_999))).rejects.toThrow(BadRequestException);
    });

    it('splits repayment into principal + interest and decrements outstanding', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(ACTIVE_LOAN as any);
      prisma.loanRepayment.create.mockResolvedValueOnce({} as any);
      prisma.staffLoan.update.mockResolvedValueOnce({ ...ACTIVE_LOAN, outstandingKobo: BigInt(200_000_00) } as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.walletTransaction.create.mockResolvedValueOnce({} as any);
      prisma.orgLedger.create.mockResolvedValue({} as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.recordRepayment('loan-1', BigInt(100_000_00), 'January salary deduction');
      // totalInterest = 2,000,000 kobo * 1.5% = 30,000 kobo (₦300)
      // interestPortion = min(30000, 10000000) = 30000, principalPortion = 9,970,000
      expect(prisma.staffLoan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ outstandingKobo: BigInt(103_000_00) }),
        }),
      );
      expect(prisma.client.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: IDS.CLIENT_DB, walletBalance: { gte: BigInt(100_000_00) } }),
          data: expect.objectContaining({ walletBalance: { decrement: BigInt(100_000_00) } }),
        }),
      );
      expect((result as any).status).toBe('ACTIVE');
    });

    it('throws when the corporate wallet lacks the funds for the repayment (guarded debit)', async () => {
      prisma.staffLoan.findUnique.mockResolvedValueOnce(ACTIVE_LOAN as any);
      prisma.loanRepayment.create.mockResolvedValueOnce({} as any);
      prisma.staffLoan.update.mockResolvedValueOnce({} as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 0 } as any); // insufficient funds

      await expect(service.recordRepayment('loan-1', BigInt(100_000_00))).rejects.toThrow(BadRequestException);
    });

    it('marks the loan REPAID and zeroes outstanding when the final payment clears the balance', async () => {
      const loan = { ...ACTIVE_LOAN, outstandingKobo: BigInt(30_000), interestEarnedKobo: BigInt(0), clientId: IDS.CLIENT_DB };
      prisma.staffLoan.findUnique.mockResolvedValueOnce(loan as any);
      prisma.loanRepayment.create.mockResolvedValueOnce({} as any);
      prisma.staffLoan.update.mockResolvedValueOnce({ ...loan, status: 'REPAID', outstandingKobo: BigInt(0) } as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.walletTransaction.create.mockResolvedValueOnce({} as any);
      prisma.orgLedger.create.mockResolvedValue({} as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.recordRepayment('loan-1', BigInt(30_000));
      expect(prisma.staffLoan.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REPAID', outstandingKobo: BigInt(0) }) }),
      );
      expect((result as any).status).toBe('REPAID');
    });
  });
});