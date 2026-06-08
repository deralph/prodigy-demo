import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseLockIn(v: any): number | null {
  if (!v) return null;
  const n = parseFloat(String(v));
  const s = String(v).toLowerCase();
  if (s.includes('year'))  return Math.round(n * 365);
  if (s.includes('month')) return Math.round(n * 30);
  if (s.includes('week'))  return Math.round(n * 7);
  if (s.includes('day'))   return Math.round(n);
  if (!isNaN(n))           return Math.round(n);
  return null;
}

function parseRate(v: any): number {
  return parseFloat(String(v ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

function safeBigInt(v: any): bigint {
  const n = Number(v ?? 0);
  return BigInt(Math.round(isNaN(n) ? 0 : n));
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = true) {
    return this.prisma.product.findMany({
      where: activeOnly ? { status: 'ACTIVE' } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAdmin() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: any, adminId: string) {
    const lockInStr: string | null = data.lockInStr || data.lockIn || null;
    const lockInDays: number | null = data.lockInDays != null
      ? Number(data.lockInDays)
      : parseLockIn(lockInStr);

    const roiMin = parseRate(data.roiMin ?? data.roi);
    const roiMax = parseRate(data.roiMax ?? data.roiMin ?? data.roi);

    const code = (data.code || data.name?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')) + '-' + Date.now();

    return this.prisma.product.create({
      data: {
        code,
        name: data.name,
        category: data.category || null,
        description: data.description || null,
        roiMin,
        roiMax,
        minInvestKobo: safeBigInt(Number(data.minInvest ?? data.minAmount ?? 0) * 100),
        maxInvestKobo: data.maxInvest ? safeBigInt(Number(data.maxInvest) * 100) : null,
        lockInDays,
        lockInStr,
        withholdingTaxRate: parseRate(data.withholdingTaxRate ?? data.taxRate ?? 10),
        earlyExitPenalty: data.earlyExitPenalty ? parseRate(data.earlyExitPenalty) : null,
        clientTypes: Array.isArray(data.clientTypes) ? data.clientTypes : ['corporate', 'individual', 'joint'],
        riskLevel: data.riskLevel || null,
        hasTenor: Boolean(data.hasTenor),
        tenorOptions: Array.isArray(data.tenorOptions) ? data.tenorOptions : [],
        color: data.color || '#3b82f6',
        isNegotiated: Boolean(data.isNegotiated),
        status: (['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(data.status?.toUpperCase())
          ? data.status.toUpperCase()
          : 'ACTIVE') as any,
        updatedById: adminId,
      },
    });
  }

  async update(id: string, patch: any, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: any = { updatedById: adminId };

    if (patch.name         !== undefined) updateData.name        = patch.name;
    if (patch.category     !== undefined) updateData.category    = patch.category || null;
    if (patch.description  !== undefined) updateData.description = patch.description || null;
    if (patch.color        !== undefined) updateData.color       = patch.color;
    if (patch.isNegotiated !== undefined) updateData.isNegotiated = Boolean(patch.isNegotiated);
    if (patch.riskLevel    !== undefined) updateData.riskLevel   = patch.riskLevel || null;
    if (patch.hasTenor     !== undefined) updateData.hasTenor    = Boolean(patch.hasTenor);
    if (patch.tenorOptions !== undefined) updateData.tenorOptions = Array.isArray(patch.tenorOptions) ? patch.tenorOptions : [];
    if (patch.clientTypes  !== undefined) updateData.clientTypes  = Array.isArray(patch.clientTypes) ? patch.clientTypes : [];

    if (patch.status !== undefined) {
      const s = patch.status?.toUpperCase();
      if (['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(s)) updateData.status = s;
    }

    if (patch.roiMin !== undefined || patch.roi !== undefined) {
      updateData.roiMin = parseRate(patch.roiMin ?? patch.roi);
      updateData.roiMax = parseRate(patch.roiMax ?? patch.roiMin ?? patch.roi);
    }

    if (patch.minAmount !== undefined || patch.minInvest !== undefined) {
      updateData.minInvestKobo = safeBigInt(Number(patch.minInvest ?? patch.minAmount ?? 0) * 100);
    }
    if (patch.maxInvest !== undefined) {
      updateData.maxInvestKobo = patch.maxInvest ? safeBigInt(Number(patch.maxInvest) * 100) : null;
    }

    if (patch.lockIn !== undefined || patch.lockInStr !== undefined) {
      const lockInStr = patch.lockInStr || patch.lockIn || null;
      updateData.lockInStr  = lockInStr;
      updateData.lockInDays = lockInStr ? parseLockIn(lockInStr) : null;
    }

    if (patch.withholdingTaxRate !== undefined || patch.taxRate !== undefined) {
      updateData.withholdingTaxRate = parseRate(patch.withholdingTaxRate ?? patch.taxRate);
    }
    if (patch.earlyExitPenalty !== undefined) {
      updateData.earlyExitPenalty = patch.earlyExitPenalty ? parseRate(patch.earlyExitPenalty) : null;
    }

    return this.prisma.product.update({ where: { id }, data: updateData });
  }
}
