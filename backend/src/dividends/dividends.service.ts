import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DividendsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.dividend.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async declare(dto: {
    productId: string;
    rate: number;
    declarationDate: Date;
    paymentDate?: Date;
    notes?: string;
  }, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Find all active investments for this product
    const eligible = await this.prisma.investment.findMany({
      where: { productId: dto.productId, status: 'ACTIVE' },
    });

    if (eligible.length === 0) throw new BadRequestException('No active investors for this product');

    const totalPayoutKobo = eligible.reduce((sum, inv) => {
      return sum + BigInt(Math.round(Number(inv.principalKobo) * (dto.rate / 100)));
    }, BigInt(0));

    const dividendRef = `DIV-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const dividend = await tx.dividend.create({
        data: {
          dividendRef,
          productId: dto.productId,
          rate: dto.rate,
          totalPayoutKobo,
          eligibleCount: eligible.length,
          declarationDate: dto.declarationDate,
          paymentDate: dto.paymentDate,
          notes: dto.notes,
          status: 'DECLARED',
          declaredById: adminId,
          entries: {
            create: eligible.map((inv) => ({
              investmentId: inv.id,
              clientId: inv.clientId,
              amountKobo: BigInt(Math.round(Number(inv.principalKobo) * (dto.rate / 100))),
            })),
          },
        },
        include: { product: true, entries: true },
      });
      return dividend;
    });
  }
}
