import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parsePagination } from '../common/utils/pagination';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: string;
    limit?: string;
    category?: string;
    adminId?: string;
    clientId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page, limit } = parsePagination(query, { page: 1, limit: 50 });
    const where: any = {};

    if (query.category) where.category = query.category as any;
    if (query.adminId) where.adminId = query.adminId;
    if (query.clientId) where.targetEntity = query.clientId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

    if (query.dateFrom || query.dateTo) {
      where.occurredAt = {};
      if (query.dateFrom) {
        const from = new Date(query.dateFrom);
        if (!isNaN(from.getTime())) where.occurredAt.gte = from;
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        if (!isNaN(to.getTime())) where.occurredAt.lte = to;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { admin: { select: { adminRef: true, name: true, role: true } } },
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async export(query: {
    category?: string;
    adminId?: string;
    clientId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};

    if (query.category) where.category = query.category as any;
    if (query.adminId) where.adminId = query.adminId;
    if (query.clientId) where.targetEntity = query.clientId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

    if (query.dateFrom || query.dateTo) {
      where.occurredAt = {};
      if (query.dateFrom) {
        const from = new Date(query.dateFrom);
        if (!isNaN(from.getTime())) where.occurredAt.gte = from;
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        if (!isNaN(to.getTime())) where.occurredAt.lte = to;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: { admin: { select: { adminRef: true, name: true, role: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 10000, // Limit export size
    });

    return logs.map(log => ({
      auditRef: log.auditRef,
      adminId: log.adminId,
      adminName: log.adminName,
      adminRole: log.adminRole,
      action: log.action,
      targetEntity: log.targetEntity,
      category: log.category,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      occurredAt: log.occurredAt,
    }));
  }
}
