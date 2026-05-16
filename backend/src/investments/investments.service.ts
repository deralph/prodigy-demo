import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from 'date-fns';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  // Client: get own investments
  async getMyInvestments(clientDbId: string) {
    return this.prisma.investment.findMany({
      where: { clientId: clientDbId },
      include: { product: true, history: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Client: subscribe to a product
  async subscribe(clientDbId: string, dto: {
    productId: string;
    principalKobo: bigint;
    tenorDays: number;
    valueDate: Date;
    autoRollover?: boolean;
    notes?: string;
  }) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.status !== 'ACTIVE') throw new ForbiddenException('Account must be active to invest. Please complete KYC.');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ACTIVE') throw new BadRequestException('Product is not currently available');
    if (dto.principalKobo < product.minInvestKobo) {
      throw new BadRequestException(`Minimum investment is ${product.minInvestKobo} kobo`);
    }

    const investRef = await this.generateInvestRef();
    const maturityDate = product.lockInDays
      ? addDays(dto.valueDate, product.lockInDays)
      : addDays(dto.valueDate, dto.tenorDays);

    return this.prisma.investment.create({
      data: {
        investRef,
        clientId: clientDbId,
        productId: dto.productId,
        status: 'PENDING_APPROVAL',
        principalKobo: dto.principalKobo,
        roiRate: product.roiMin,
        tenorDays: dto.tenorDays,
        valueDate: dto.valueDate,
        maturityDate,
        autoRollover: dto.autoRollover ?? false,
        notes: dto.notes,
        history: {
          create: { action: 'Subscription Submitted', note: 'Awaiting ops approval' },
        },
      },
      include: { product: true },
    });
  }

  // Client: request redemption (creates pre-termination)
  async requestRedemption(clientDbId: string, investmentId: string, reason?: string) {
    const inv = await this.prisma.investment.findFirst({
      where: { id: investmentId, clientId: clientDbId, status: 'ACTIVE' },
    });
    if (!inv) throw new NotFoundException('Active investment not found');

    return this.prisma.preTermination.create({
      data: {
        preTermRef: `PT-${Date.now()}`,
        investmentId,
        clientId: clientDbId,
        requestedAmountKobo: inv.principalKobo,
        penaltyKobo: BigInt(0),
        netPayoutKobo: inv.principalKobo,
        reason,
      },
    });
  }

  // Admin: book investment for client
  async adminBook(dto: {
    clientRef: string;
    productId: string;
    principalKobo: bigint;
    roiRate: number;
    tenorDays: number;
    valueDate: Date;
    autoRollover?: boolean;
    notes?: string;
  }, adminId: string) {
    const client = await this.prisma.client.findUnique({ where: { clientRef: dto.clientRef } });
    if (!client) throw new NotFoundException('Client not found');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const investRef = await this.generateInvestRef();
    const maturityDate = addDays(dto.valueDate, dto.tenorDays);

    return this.prisma.investment.create({
      data: {
        investRef,
        clientId: client.id,
        productId: dto.productId,
        status: 'ACTIVE',
        principalKobo: dto.principalKobo,
        roiRate: dto.roiRate,
        tenorDays: dto.tenorDays,
        valueDate: dto.valueDate,
        maturityDate,
        autoRollover: dto.autoRollover ?? false,
        notes: dto.notes,
        bookedById: adminId,
        bookedAt: new Date(),
        approvedById: adminId,
        approvedAt: new Date(),
        history: {
          create: { action: 'Booked by Admin', note: dto.notes, performedById: adminId },
        },
      },
      include: { product: true, client: true },
    });
  }

  // Admin: get all investments with filters
  async adminFindAll(query: { search?: string; productId?: string; status?: string; clientId?: string }) {
    return this.prisma.investment.findMany({
      where: {
        ...(query.productId && { productId: query.productId }),
        ...(query.status && { status: query.status as any }),
        ...(query.clientId && { client: { clientRef: query.clientId } }),
        ...(query.search && {
          OR: [
            { investRef: { contains: query.search, mode: 'insensitive' } },
            { client: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: { product: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatement(investmentId: string, clientDbId?: string) {
    const where = clientDbId ? { id: investmentId, clientId: clientDbId } : { id: investmentId };
    const inv = await this.prisma.investment.findFirst({
      where,
      include: { product: true, client: true, history: true },
    });
    if (!inv) throw new NotFoundException('Investment not found');
    return inv;
  }

  private async generateInvestRef(): Promise<string> {
    const count = await this.prisma.investment.count();
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }
}
