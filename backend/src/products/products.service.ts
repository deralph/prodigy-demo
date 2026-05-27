import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function parseLockIn(v: any): number {
  if (!v) return 30;
  const n = parseFloat(String(v));
  const s = String(v).toLowerCase();
  if (s.includes('year'))  return Math.round(n * 365);
  if (s.includes('month')) return Math.round(n * 30);
  if (s.includes('week'))  return Math.round(n * 7);
  if (!isNaN(n))           return Math.round(n);
  return 30;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = true) {
    return this.prisma.product.findMany({
      where: activeOnly ? { status: 'ACTIVE' } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: any, adminId: string) {
    const parseRate = (v: any): number => parseFloat(String(v ?? 0).replace(/[^0-9.]/g, '')) || 0;
    return this.prisma.product.create({
      data: {
        code: data.code || data.name?.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        description: data.description,
        roiMin: parseRate(data.roiMin ?? data.roi),
        roiMax: parseRate(data.roiMax ?? data.roi),
        minInvestKobo: BigInt(Math.round(Number(data.minInvest ?? data.minAmount ?? 0) * 100)),
        lockInDays: data.lockInDays ?? parseLockIn(data.lockIn),
        color: data.color || '#3b82f6',
        isNegotiated: data.isNegotiated || false,
        status: 'ACTIVE',
        updatedById: adminId,
      },
    });
  }

  async update(id: string, patch: Partial<{ roiMin: number; roiMax: number; minInvestKobo: bigint; lockInDays: number; description: string; status: ProductStatus }>, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: { ...patch, updatedById: adminId },
    });
  }
}
