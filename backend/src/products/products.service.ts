import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    return this.prisma.product.create({
      data: {
        code: data.code || data.name?.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        description: data.description,
        roiMin: data.roiMin || data.roi,
        roiMax: data.roiMax || data.roi,
        minInvestKobo: BigInt((data.minInvest || 0) * 100),
        lockInDays: data.lockInDays || 30,
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
