import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

function toEnumRole(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'SUPER_ADMIN',
    operations: 'OPERATIONS',
    compliance: 'COMPLIANCE',
    finance: 'FINANCE',
    audit: 'AUDIT',
    investment: 'INVESTMENT',
  };
  return map[role?.toLowerCase()] || 'OPERATIONS';
}

function toEnumStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'ACTIVE',
    locked: 'LOCKED',
    deleted: 'DELETED',
  };
  return map[status?.toLowerCase()] || 'ACTIVE';
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      include: { authUser: { select: { email: true, isActive: true, lastLoginAt: true } } },
    });
  }

  async create(data: { name: string; email: string; role: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const adminRef = `ADM-${Date.now().toString().slice(-6)}`;

    // Create AdminUser + linked AuthUser in a transaction
    return this.prisma.$transaction(async (tx) => {
      const adminUser = await tx.adminUser.create({
        data: {
          adminRef,
          name: data.name,
          email: data.email,
          role: toEnumRole(data.role) as any,
          status: 'ACTIVE',
        },
      });

      await tx.authUser.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: 'admin',
          adminUserId: adminUser.id,
        },
      });

      return adminUser;
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = toEnumRole(data.role) as any;
    if (data.status) updateData.status = toEnumStatus(data.status) as any;
    if (data.department) updateData.department = data.department;

    return this.prisma.adminUser.update({
      where: { id },
      data: updateData,
    });
  }
}
