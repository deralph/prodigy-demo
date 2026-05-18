import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LegacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getLegacyPlan(clientId: string) {
    // Shared Legacy / Joint account estate planning data
    const client = await this.prisma.client.findFirst({ where: { id: clientId } });
    if (!client) return { message: 'No legacy plan found' };

    return {
      clientId,
      beneficiaries: [],
      estateValue: 0,
      lastUpdated: null,
    };
  }
}
