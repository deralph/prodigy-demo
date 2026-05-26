import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findAll ───────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns only ACTIVE products by default', async () => {
      prisma.product.findMany.mockResolvedValueOnce([MOCK.product] as any);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } }),
      );
    });

    it('returns all products when activeOnly=false', async () => {
      prisma.product.findMany.mockResolvedValueOnce([MOCK.product, { ...MOCK.product, status: 'INACTIVE', id: 'p2' }] as any);
      const result = await service.findAll(false);
      expect(result).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('orders results by name ascending', async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);
      await service.findAll();
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  // ── findOne ───────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns product by id', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      const result = await service.findOne(IDS.PRODUCT);
      expect(result.id).toBe(IDS.PRODUCT);
    });

    it('throws NotFoundException for unknown id', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────
  describe('update()', () => {
    it('patches product fields as admin', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.product.update.mockResolvedValueOnce({ ...MOCK.product, roiMin: 16.5 } as any);

      const result = await service.update(IDS.PRODUCT, { roiMin: 16.5 }, IDS.ADMIN_USER);
      expect(result.roiMin).toBe(16.5);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ updatedById: IDS.ADMIN_USER }) }),
      );
    });

    it('updates product status with typed enum', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.product.update.mockResolvedValueOnce({ ...MOCK.product, status: ProductStatus.INACTIVE } as any);

      const result = await service.update(IDS.PRODUCT, { status: ProductStatus.INACTIVE }, IDS.ADMIN_USER);
      expect(result.status).toBe(ProductStatus.INACTIVE);
    });

    it('throws NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('bad-id', { roiMin: 10 }, IDS.ADMIN_USER)).rejects.toThrow(NotFoundException);
    });
  });
});
