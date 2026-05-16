import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; type?: string; status?: string }) {
    return this.prisma.client.findMany({
      where: {
        ...(query.type && { type: query.type as any }),
        ...(query.status && { status: query.status as any }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { clientRef: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { kycRecord: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { clientRef: clientId },
      include: { kycRecord: true, kycDocuments: true, investments: true, riskProfile: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async updateStatus(clientId: string, status: string, adminId: string) {
    const client = await this.prisma.client.findUnique({ where: { clientRef: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    return this.prisma.client.update({
      where: { id: client.id },
      data: { status: status as any },
    });
  }

  async updateMandate(clientDbId: string, mandateType: 'AND' | 'OR') {
    return this.prisma.client.update({
      where: { id: clientDbId },
      data: { mandateType },
    });
  }

  async getMe(clientDbId: string) {
    return this.prisma.client.findUnique({
      where: { id: clientDbId },
      include: { kycRecord: true, riskProfile: true },
    });
  }
}
