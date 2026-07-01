import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DividendsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

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
  }, adminId: string, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
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

    const dividend = await this.prisma.$transaction(async (tx) => {
      return tx.dividend.create({
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
    });

    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'DIVIDEND_DECLARED',
      targetEntity: dividend.id,
      category: 'FINANCE',
      metadata: {
        productName: product.name,
        rate: dto.rate,
        eligibleCount: eligible.length,
        totalPayoutKobo: Number(totalPayoutKobo),
      },
    });

    // Notify every eligible client of their payout — never blocks the response.
    const clientIds = [...new Set(eligible.map((inv) => inv.clientId))];
    this.prisma.client.findMany({ where: { id: { in: clientIds } } }).then((clients: any[]) => {
      const byId = new Map<string, any>(clients.map((c) => [c.id, c]));
      for (const inv of eligible) {
        const client = byId.get(inv.clientId);
        if (!client) continue;
        const amountNaira = (Number(inv.principalKobo) * (dto.rate / 100)) / 100;
        this.notifications.sendDividendDeclaredEmail(client.email, client.name, product.name, amountNaira).catch(() => {});
      }
    }).catch(() => {});

    return dividend;
  }
}
