import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
    it('sets approval status to APPROVED with reviewer details', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'OTHER' } as any);
      prisma.approval.update.mockResolvedValueOnce({ ...MOCK.approval, status: 'APPROVED' } as any);

      const result = await service.approve(IDS.APPROVAL, IDS.ADMIN_USER, 'Looks good');
      expect(result.status).toBe('APPROVED');
      expect(prisma.approval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'APPROVED', reviewedById: IDS.ADMIN_USER }),
        }),
      );
    });

    it('also activates investment when type is SUBSCRIPTION', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT, details: { productName: 'Aura Fixed Income' } } as any);
      prisma.approval.update.mockResolvedValueOnce({ ...MOCK.approval, status: 'APPROVED' } as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'ACTIVE' } as any);
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);

      await service.approve(IDS.APPROVAL, IDS.ADMIN_USER);
      expect(prisma.investment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
      expect(notifications.sendInvestmentActivatedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, 'Aura Fixed Income', expect.any(Number), expect.any(Date),
      );
    });

    it('throws NotFoundException when approval not found', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(service.approve('bad-id', IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });
  });

  // ── reject ────────────────────────────────────────────────────────
  describe('reject()', () => {
    it('sets approval status to REJECTED with reason', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'OTHER' } as any);
      prisma.approval.update.mockResolvedValueOnce({ ...MOCK.approval, status: 'REJECTED' } as any);

      const result = await service.reject(IDS.APPROVAL, IDS.ADMIN_USER, 'Insufficient docs');
      expect(result.status).toBe('REJECTED');
      expect(prisma.approval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REJECTED', reviewNotes: 'Insufficient docs' }),
        }),
      );
    });

    it('also rejects the investment when type is SUBSCRIPTION', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT, details: { productName: 'Aura Fixed Income' } } as any);
      prisma.approval.update.mockResolvedValueOnce({ ...MOCK.approval, status: 'REJECTED' } as any);
      prisma.investment.findUnique.mockResolvedValueOnce(MOCK.investment as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'REJECTED' } as any);
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);

      await service.reject(IDS.APPROVAL, IDS.ADMIN_USER, 'Reason');
      expect(prisma.investment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) }),
      );
      expect(notifications.sendInvestmentRejectedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, 'Aura Fixed Income', expect.any(Number), 'Reason',
      );
    });

    it('throws NotFoundException when approval not found', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(service.reject('bad-id', IDS.ADMIN_USER, 'reason')).rejects.toThrow(NotFoundException);
    });
  });
});
