import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getClientActivity(clientId: string, query: { page?: string; limit?: string }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '30');

    // Return recent activity log entries for this client
    const activities = await this.prisma.activityLog.findMany({
      where: { clientId },
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: activities, page, limit };
  }
}
