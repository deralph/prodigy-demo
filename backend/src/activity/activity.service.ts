import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parsePagination } from '../common/utils/pagination';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getClientActivity(clientId: string, query: { page?: string; limit?: string }) {
    const { page, limit } = parsePagination(query, { page: 1, limit: 30 });

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
