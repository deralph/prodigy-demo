import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminUsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AdminUsersService);
  });

  afterEach(() => jest.clearAllMocks());

  const validDto = { name: 'Jane Doe', email: 'jane.new@prodigy.ng', role: 'compliance', password: 'Valid1234' };

  describe('create()', () => {
    it('rejects a password shorter than 8 characters', async () => {
      await expect(service.create({ ...validDto, password: 'Sh0rt' })).rejects.toThrow(BadRequestException);
    });

    it('rejects a password missing required character classes', async () => {
      await expect(service.create({ ...validDto, password: 'alllowercase1' })).rejects.toThrow(/uppercase/i);
    });

    it('rejects a duplicate email', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(MOCK.authUser as any);
      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
    });

    it('creates the AdminUser + linked AuthUser and writes an audit log', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      const created = { id: 'new-admin-1', adminRef: 'ADM-000001', name: validDto.name, email: validDto.email, role: 'COMPLIANCE' };
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        adminUser: { create: jest.fn().mockResolvedValue(created) },
        authUser: { create: jest.fn().mockResolvedValue({}) },
      }));
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Super Admin' } as any);

      const result = await service.create(validDto, { adminUserId: IDS.ADMIN_USER, adminRole: 'SUPER_ADMIN' });
      expect(result.email).toBe(validDto.email);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'ADMIN_USER_CREATED', category: 'SYSTEM' }) }),
      );
    });

    it('maps an unrecognized role to OPERATIONS as a safe default', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      const createSpy = jest.fn().mockResolvedValue({ id: 'x', email: validDto.email });
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        adminUser: { create: createSpy },
        authUser: { create: jest.fn().mockResolvedValue({}) },
      }));

      await service.create({ ...validDto, role: 'totally-unknown-role' });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'OPERATIONS' }) }),
      );
    });
  });

  describe('update()', () => {
    it('throws NotFoundException when the target admin does not exist', async () => {
      prisma.adminUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('bad-id', { status: 'locked' })).rejects.toThrow(NotFoundException);
    });

    it('updates role/status and writes an audit log capturing the previous values', async () => {
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: 'target-1', email: 'target@prodigy.ng', role: 'OPERATIONS', status: 'ACTIVE' } as any);
      prisma.adminUser.update.mockResolvedValueOnce({ id: 'target-1', role: 'COMPLIANCE', status: 'ACTIVE' } as any);

      await service.update('target-1', { role: 'compliance' }, { adminUserId: IDS.ADMIN_USER, adminRole: 'SUPER_ADMIN' });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ADMIN_USER_UPDATED',
            metadata: expect.objectContaining({ previousRole: 'OPERATIONS' }),
          }),
        }),
      );
    });

    it('can lock an admin account (status change)', async () => {
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: 'target-1', email: 'target@prodigy.ng', role: 'OPERATIONS', status: 'ACTIVE' } as any);
      prisma.adminUser.update.mockResolvedValueOnce({ id: 'target-1', status: 'LOCKED' } as any);

      const result = await service.update('target-1', { status: 'locked' });
      expect(prisma.adminUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'LOCKED' }) }),
      );
    });
  });
});
