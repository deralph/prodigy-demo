import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notifications: ReturnType<typeof createMockNotifications>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    notifications = createMockNotifications();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(InvestmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getMyInvestments ──────────────────────────────────────────────
  describe('getMyInvestments()', () => {
    it('returns investments for the client ordered by date', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([MOCK.investment] as any);
      const result = await service.getMyInvestments(IDS.CLIENT_DB);
      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe(IDS.CLIENT_DB);
    });

    it('returns empty array when client has no investments', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([]);
      const result = await service.getMyInvestments(IDS.CLIENT_DB);
      expect(result).toEqual([]);
    });
  });

  // ── subscribe ─────────────────────────────────────────────────────
  describe('subscribe()', () => {
    const dto = {
      productId: IDS.PRODUCT,
      principalKobo: BigInt(200_000_00),
      tenorDays: 90,
      valueDate: new Date('2024-06-01'),
    };

    it('creates investment with PENDING_APPROVAL status', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(0);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'PENDING_APPROVAL', product: MOCK.product,
      } as any);

      const result = await service.subscribe(IDS.CLIENT_DB, dto);
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(prisma.investment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING_APPROVAL' }) }),
      );
      // Notifies both the investing client and the ops/super-admin team
      expect(notifications.sendInvestmentSubmittedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, MOCK.product.name, expect.any(Number),
      );
      expect(notifications.notifyAdminsByRole).toHaveBeenCalledWith(
        ['SUPER_ADMIN', 'OPERATIONS'], expect.any(String), expect.any(String),
      );
    });

    it('throws ForbiddenException when client status is PENDING_KYC', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, status: 'PENDING_KYC' } as any);
      await expect(service.subscribe(IDS.CLIENT_DB, dto)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when client does not exist', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.subscribe('bad-id', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product does not exist', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(service.subscribe(IDS.CLIENT_DB, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product is INACTIVE', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce({ ...MOCK.product, status: 'INACTIVE' } as any);
      await expect(service.subscribe(IDS.CLIENT_DB, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when principal is below minimum', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      const lowDto = { ...dto, principalKobo: BigInt(100) }; // way below minInvestKobo
      await expect(service.subscribe(IDS.CLIENT_DB, lowDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when principal exceeds the product maximum', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce({ ...MOCK.product, maxInvestKobo: BigInt(300_000_00) } as any);
      const highDto = { ...dto, principalKobo: BigInt(1_000_000_00) }; // above maxInvestKobo
      await expect(service.subscribe(IDS.CLIENT_DB, highDto)).rejects.toThrow(BadRequestException);
    });

    it('allows a principal exactly at the product maximum', async () => {
      const cappedProduct = { ...MOCK.product, maxInvestKobo: BigInt(200_000_00) };
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(cappedProduct as any);
      prisma.investment.count.mockResolvedValueOnce(0);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'PENDING_APPROVAL', product: cappedProduct,
      } as any);

      const result = await service.subscribe(IDS.CLIENT_DB, { ...dto, principalKobo: BigInt(200_000_00) });
      expect(result.status).toBe('PENDING_APPROVAL');
    });

    it('has no maximum cap when maxInvestKobo is null (unlimited product)', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, walletBalance: BigInt(999_999_999_00) } as any);
      prisma.product.findUnique.mockResolvedValueOnce({ ...MOCK.product, maxInvestKobo: null } as any);
      prisma.investment.count.mockResolvedValueOnce(0);
      prisma.investment.create.mockResolvedValueOnce({ ...MOCK.investment, status: 'PENDING_APPROVAL' } as any);

      const result = await service.subscribe(IDS.CLIENT_DB, { ...dto, principalKobo: BigInt(50_000_000_00) });
      expect(result.status).toBe('PENDING_APPROVAL');
    });
  });

  // ── requestRedemption ─────────────────────────────────────────────
  describe('requestRedemption()', () => {
    it('creates a pre-termination record for an active investment', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce(MOCK.investment as any);
      prisma.preTermination.create.mockResolvedValueOnce({ id: IDS.PRE_TERM } as any);

      const result = await service.requestRedemption(IDS.CLIENT_DB, IDS.INVESTMENT, 'Need funds');
      expect(prisma.preTermination.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ investmentId: IDS.INVESTMENT }) }),
      );
    });

    it('throws NotFoundException when active investment not found for client', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce(null);
      await expect(service.requestRedemption(IDS.CLIENT_DB, 'bad-inv', 'reason')).rejects.toThrow(NotFoundException);
    });
  });

  // ── adminBook ─────────────────────────────────────────────────────
  describe('adminBook()', () => {
    const dto = {
      clientRef: 'CLI-001',
      productId: IDS.PRODUCT,
      principalKobo: BigInt(500_000_00),
      roiRate: 16.0,
      tenorDays: 180,
      valueDate: new Date('2024-01-01'),
    };

    it('books investment as ACTIVE directly (admin bypass)', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(5);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'ACTIVE', product: MOCK.product, client: MOCK.client,
      } as any);

      const result = await service.adminBook(dto, IDS.ADMIN_USER);
      expect(result.status).toBe('ACTIVE');
      expect(prisma.investment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE', bookedById: IDS.ADMIN_USER }) }),
      );
    });

    it('throws NotFoundException when clientRef not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.adminBook(dto, IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(service.adminBook(dto, IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when admin tries to book below the product minimum', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      await expect(service.adminBook({ ...dto, principalKobo: BigInt(100) }, IDS.ADMIN_USER)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when admin tries to book above the product maximum', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce({ ...MOCK.product, maxInvestKobo: BigInt(300_000_00) } as any);
      await expect(service.adminBook({ ...dto, principalKobo: BigInt(1_000_000_00) }, IDS.ADMIN_USER)).rejects.toThrow(BadRequestException);
    });

    it('writes an audit log entry recording which admin booked the investment', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(5);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'ACTIVE', product: MOCK.product, client: MOCK.client,
      } as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Ops Officer' } as any);

      await service.adminBook(dto, IDS.ADMIN_USER, { adminUserId: IDS.ADMIN_USER, adminRole: 'OPERATIONS' });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'INVESTMENT_BOOKED_BY_ADMIN', category: 'INVESTMENT' }) }),
      );
    });
  });

  // ── adminFindAll ──────────────────────────────────────────────────
  describe('adminFindAll()', () => {
    it('returns all investments when no filters', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([MOCK.investment] as any);
      const result = await service.adminFindAll({});
      expect(result).toHaveLength(1);
    });

    it('filters by status', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([]);
      await service.adminFindAll({ status: 'MATURED' });
      expect(prisma.investment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'MATURED' }) }),
      );
    });
  });

  // ── getStatement ─────────────────────────────────────────────────
  describe('getStatement()', () => {
    it('returns investment with history for client', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce({
        ...MOCK.investment, product: MOCK.product, client: MOCK.client, history: [],
      } as any);
      const result = await service.getStatement(IDS.INVESTMENT, IDS.CLIENT_DB);
      expect(result.id).toBe(IDS.INVESTMENT);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce(null);
      await expect(service.getStatement('bad', IDS.CLIENT_DB)).rejects.toThrow(NotFoundException);
    });
  });
});
