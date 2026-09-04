import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notifications: ReturnType<typeof createMockNotifications>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    notifications = createMockNotifications();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(ApprovalsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ───────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns all approvals when no filters supplied', async () => {
      prisma.approval.findMany.mockResolvedValueOnce([MOCK.approval] as any);
      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by status', async () => {
      prisma.approval.findMany.mockResolvedValueOnce([]);
      await service.findAll({ status: 'PENDING' });
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) }),
      );
    });

    it('filters by type', async () => {
      prisma.approval.findMany.mockResolvedValueOnce([]);
      await service.findAll({ type: 'SUBSCRIPTION' });
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'SUBSCRIPTION' }) }),
      );
    });

    it('includes client, investment.product, and product relations', async () => {
      prisma.approval.findMany.mockResolvedValueOnce([]);
      await service.findAll({});
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ client: true, product: true }),
        }),
      );
    });
  });

  // ── approve ───────────────────────────────────────────────────────
  describe('approve()', () => {
    it('claims and sets approval status to APPROVED with reviewer details', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'OTHER' } as any);

      const result = await service.approve(IDS.APPROVAL, IDS.ADMIN_USER, 'Looks good');
      expect((result as any).status).toBe('PENDING'); // returns the pre-transition record
      expect(prisma.approval.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: IDS.APPROVAL, status: 'PENDING' }),
          data: expect.objectContaining({ status: 'APPROVED', reviewedById: IDS.ADMIN_USER }),
        }),
      );
    });

    it('also activates investment when type is SUBSCRIPTION (atomic claim + guarded pending clear)', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT, details: { productName: 'Aura Fixed Income' } } as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'ACTIVE' } as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);

      await service.approve(IDS.APPROVAL, IDS.ADMIN_USER);
      expect(prisma.investment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
      expect(prisma.client.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: IDS.CLIENT_DB, pendingBalance: { gte: MOCK.investment.principalKobo } }),
          data: expect.objectContaining({ pendingBalance: { decrement: MOCK.investment.principalKobo } }),
        }),
      );
      expect(notifications.sendInvestmentActivatedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, 'Aura Fixed Income', expect.any(Number), expect.any(Date),
      );
    });

    it('throws BadRequestException when the approval was already processed (claim lost)', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 0 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, status: 'APPROVED' } as any);

      await expect(service.approve(IDS.APPROVAL, IDS.ADMIN_USER)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when approval not found', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 0 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(service.approve('bad-id', IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when client pendingBalance is insufficient (guarded decrement fails)', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT, details: {} } as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'ACTIVE' } as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 0 } as any);

      await expect(service.approve(IDS.APPROVAL, IDS.ADMIN_USER)).rejects.toThrow(BadRequestException);
    });
  });

  // ── reject ────────────────────────────────────────────────────────
  describe('reject()', () => {
    it('claims and sets approval status to REJECTED with reason', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'OTHER' } as any);

      const result = await service.reject(IDS.APPROVAL, IDS.ADMIN_USER, 'Insufficient docs');
      expect(prisma.approval.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: IDS.APPROVAL, status: 'PENDING' }),
          data: expect.objectContaining({ status: 'REJECTED', reviewNotes: 'Insufficient docs' }),
        }),
      );
      expect((result as any).status).toBe('PENDING');
    });

    it('also rejects the investment and refunds the wallet when type is SUBSCRIPTION', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT, details: { productName: 'Aura Fixed Income' } } as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'REJECTED' } as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);

      await service.reject(IDS.APPROVAL, IDS.ADMIN_USER, 'Reason');
      expect(prisma.investment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) }),
      );
      expect(prisma.client.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: IDS.CLIENT_DB, pendingBalance: { gte: MOCK.investment.principalKobo } }),
          data: expect.objectContaining({
            walletBalance: { increment: MOCK.investment.principalKobo },
            pendingBalance: { decrement: MOCK.investment.principalKobo },
          }),
        }),
      );
      expect(notifications.sendInvestmentRejectedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, 'Aura Fixed Income', expect.any(Number), 'Reason',
      );
    });

    it('throws BadRequestException when already processed (no double refund)', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 0 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, status: 'REJECTED' } as any);
      await expect(service.reject(IDS.APPROVAL, IDS.ADMIN_USER, 'reason')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when approval not found', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 0 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(service.reject('bad-id', IDS.ADMIN_USER, 'reason')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when client pendingBalance is insufficient for the refund', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any);
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT, details: {} } as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'REJECTED' } as any);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 0 } as any);

      await expect(service.reject(IDS.APPROVAL, IDS.ADMIN_USER, 'Reason')).rejects.toThrow(BadRequestException);
    });
  });
});