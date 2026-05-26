import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GoalStatus } from '@prisma/client';
import { GoalsService } from './goals.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';

describe('GoalsService', () => {
  let service: GoalsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoalsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(GoalsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ───────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns all goals for the client', async () => {
      prisma.goal.findMany.mockResolvedValueOnce([MOCK.goal] as any);
      const result = await service.findAll(IDS.CLIENT_DB);
      expect(result).toHaveLength(1);
      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: IDS.CLIENT_DB } }),
      );
    });

    it('returns empty array when client has no goals', async () => {
      prisma.goal.findMany.mockResolvedValueOnce([]);
      const result = await service.findAll(IDS.CLIENT_DB);
      expect(result).toEqual([]);
    });
  });

  // ── create ────────────────────────────────────────────────────────
  describe('create()', () => {
    it('creates a goal for the client', async () => {
      prisma.goal.create.mockResolvedValueOnce(MOCK.goal as any);
      const dto = { name: 'School Fees', targetAmountKobo: BigInt(500_000_00) };
      const result = await service.create(IDS.CLIENT_DB, dto);
      expect(result.name).toBe('School Fees');
      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ clientId: IDS.CLIENT_DB, name: 'School Fees' }) }),
      );
    });

    it('creates a goal with optional targetDate and notes', async () => {
      const fullGoal = { ...MOCK.goal, targetDate: new Date('2025-12-31'), notes: 'Priority goal' };
      prisma.goal.create.mockResolvedValueOnce(fullGoal as any);
      const result = await service.create(IDS.CLIENT_DB, {
        name: 'School Fees',
        targetAmountKobo: BigInt(500_000_00),
        targetDate: new Date('2025-12-31'),
        notes: 'Priority goal',
      });
      expect(result.notes).toBe('Priority goal');
    });
  });

  // ── update ────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates goal fields for the owner', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(MOCK.goal as any);
      prisma.goal.update.mockResolvedValueOnce({ ...MOCK.goal, name: 'University Fees' } as any);

      const result = await service.update(IDS.CLIENT_DB, IDS.GOAL, { name: 'University Fees' });
      expect(result.name).toBe('University Fees');
    });

    it('updates goal status to valid GoalStatus enum value', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(MOCK.goal as any);
      prisma.goal.update.mockResolvedValueOnce({ ...MOCK.goal, status: GoalStatus.ACHIEVED } as any);

      const result = await service.update(IDS.CLIENT_DB, IDS.GOAL, { status: GoalStatus.ACHIEVED });
      expect(result.status).toBe(GoalStatus.ACHIEVED);
    });

    it('throws NotFoundException when goal not found', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(null);
      await expect(service.update(IDS.CLIENT_DB, 'bad-goal', { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when goal belongs to a different client', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce({ ...MOCK.goal, clientId: 'other-client' } as any);
      await expect(service.update(IDS.CLIENT_DB, IDS.GOAL, { name: 'x' })).rejects.toThrow(ForbiddenException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('deletes goal for the owner', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(MOCK.goal as any);
      prisma.goal.delete.mockResolvedValueOnce(MOCK.goal as any);

      await service.remove(IDS.CLIENT_DB, IDS.GOAL);
      expect(prisma.goal.delete).toHaveBeenCalledWith({ where: { id: IDS.GOAL } });
    });

    it('throws NotFoundException when goal not found', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove(IDS.CLIENT_DB, 'bad-goal')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when goal belongs to a different client', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce({ ...MOCK.goal, clientId: 'another-client' } as any);
      await expect(service.remove(IDS.CLIENT_DB, IDS.GOAL)).rejects.toThrow(ForbiddenException);
    });
  });
});
