import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuditPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async generateToken(clientDbId: string, email: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientDbId },
    });
    if (!client) throw new NotFoundException('Client not found');

    // Generate a secure random token (32 bytes = 64 hex chars)
    const token = randomBytes(32).toString('hex');

    // Expire in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.auditToken.create({
      data: {
        token,
        clientId: clientDbId,
        email,
        expiresAt,
      },
    });

    return { token, email, expiresAt };
  }

  async verifyToken(token: string) {
    const record = await this.prisma.auditToken.findUnique({
      where: { token },
    });

    if (!record) throw new NotFoundException('Audit token not found');
    if (record.expiresAt < new Date()) throw new BadRequestException('Audit link has expired');
    // Note: Token can be viewed multiple times within the expiry window
    // usedAt is only tracked for audit logging purposes, not to restrict access

    const client = await this.prisma.client.findUnique({
      where: { id: record.clientId },
      include: {
        investments: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
        kycRecord: true,
      },
    });

    if (!client) throw new NotFoundException('Client not found');

    return {
      client: {
        name: client.name,
        email: client.email,
        clientRef: client.clientRef,
        type: client.type,
        status: client.status,
      },
      investments: client.investments.map(inv => ({
        id: inv.id,
        investRef: inv.investRef,
        productName: inv.product?.name || '—',
        principalKobo: Number(inv.principalKobo),
        roiRate: Number(inv.roiRate),
        tenorDays: inv.tenorDays,
        status: inv.status,
        valueDate: inv.valueDate,
        maturityDate: inv.maturityDate,
        createdAt: inv.createdAt,
      })),
      walletBalanceKobo: Number(client.walletBalance || 0),
      kycStatus: client.kycRecord?.status || 'NOT_SUBMITTED',
    };
  }
}
