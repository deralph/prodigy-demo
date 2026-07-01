import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notifications: ReturnType<typeof createMockNotifications>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    notifications = createMockNotifications();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(ClientsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ───────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns all clients when no filters supplied', async () => {
      prisma.client.findMany.mockResolvedValueOnce([MOCK.client]);
      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(prisma.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('applies type filter', async () => {
      prisma.client.findMany.mockResolvedValueOnce([]);
      await service.findAll({ type: 'CORPORATE' });
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'CORPORATE' }) }),
      );
    });

    it('applies status filter', async () => {
      prisma.client.findMany.mockResolvedValueOnce([]);
      await service.findAll({ status: 'ACTIVE' });
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });

    it('applies search filter with OR on name/email/ref', async () => {
      prisma.client.findMany.mockResolvedValueOnce([MOCK.client]);
      await service.findAll({ search: 'John' });
      const callArg = prisma.client.findMany.mock.calls[0][0] as any;
      expect(callArg.where.OR).toHaveLength(3);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns full client profile by clientRef', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, investments: [], kycDocuments: [] } as any);
      const result = await service.findOne('CLI-001');
      expect(result.clientRef).toBe('CLI-001');
    });

    it('throws NotFoundException when client not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('DOES-NOT-EXIST')).rejects.toThrow(NotFoundException);
    });

    it('never requests raw kycDocuments — those are PII and must only flow through the role-gated KYC endpoints', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, investments: [] } as any);
      await service.findOne('CLI-001');
      const callArgs = prisma.client.findUnique.mock.calls[0][0];
      expect(callArgs.include.kycDocuments).toBeUndefined();
    });
  });

  // ── getMe ─────────────────────────────────────────────────────────
  describe('getMe()', () => {
    it('returns own client with kycRecord and riskProfile', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      const result = await service.getMe(IDS.CLIENT_DB);
      expect(result!.id).toBe(IDS.CLIENT_DB);
      expect(prisma.client.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: IDS.CLIENT_DB } }),
      );
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────
  describe('updateStatus()', () => {
    it('updates client status as admin', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.client.update.mockResolvedValueOnce({ ...MOCK.client, status: 'SUSPENDED' } as any);

      const result = await service.updateStatus('CLI-001', 'SUSPENDED', IDS.ADMIN_USER);
      expect(result.status).toBe('SUSPENDED');
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SUSPENDED' } }),
      );
    });

    it('writes an audit log entry recording who changed the status', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.client.update.mockResolvedValueOnce({ ...MOCK.client, status: 'SUSPENDED' } as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Compliance Officer' } as any);

      await service.updateStatus('CLI-001', 'SUSPENDED', IDS.ADMIN_USER, { adminRole: 'OPERATIONS' });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CLIENT_STATUS_CHANGED', category: 'OPERATIONS' }) }),
      );
    });

    it('throws NotFoundException when clientRef not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.updateStatus('BAD-REF', 'SUSPENDED', IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateMandateByClientRef ─────────────────────────────────────
  describe('updateMandateByClientRef()', () => {
    it('updates mandateType for joint client and writes an audit log', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, mandateType: 'AND' } as any);
      prisma.client.update.mockResolvedValueOnce({ ...MOCK.client, mandateType: 'OR' } as any);
      prisma.auditLog.create.mockResolvedValueOnce({});

      const result = await service.updateMandateByClientRef('CLI-001', 'OR', { adminId: IDS.ADMIN_USER, adminRole: 'COMPLIANCE' });

      expect(result.mandateType).toBe('OR');
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { mandateType: 'OR' } }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'MANDATE_TYPE_CHANGED' }) }),
      );
    });

    it('throws NotFoundException when clientRef not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.updateMandateByClientRef('BAD-REF', 'OR', { adminId: IDS.ADMIN_USER, adminRole: 'COMPLIANCE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an invalid mandate type', async () => {
      await expect(
        service.updateMandateByClientRef('CLI-001', 'INVALID' as any, { adminId: IDS.ADMIN_USER, adminRole: 'COMPLIANCE' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
