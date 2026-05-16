import { Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, patch: Partial<{ roiMin: number; roiMax: number; minInvestKobo: bigint; lockInDays: number; description: string; status: string }>, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: { ...patch, updatedById: adminId },
    });
  }
}
