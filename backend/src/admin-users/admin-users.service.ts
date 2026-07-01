import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { logAdminAction } from '../common/audit/log-admin-action';

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

  async create(data: { name: string; email: string; role: string; password: string }, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    if (!data.password || data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
    if (!(/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) && /\d/.test(data.password))) {
      throw new BadRequestException('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    const existing = await this.prisma.authUser.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('An account with this email already exists.');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const adminRef = `ADM-${Date.now().toString().slice(-6)}`;
    const newRole = toEnumRole(data.role);

    // Create AdminUser + linked AuthUser in a transaction
    const adminUser = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adminUser.create({
        data: {
          adminRef,
          name: data.name,
          email: data.email,
          role: newRole as any,
          status: 'ACTIVE',
        },
      });

      await tx.authUser.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: 'admin',
          adminUserId: created.id,
        },
      });

      return created;
    });

    // Creating a new admin (especially SUPER_ADMIN/COMPLIANCE/FINANCE) is the
    // highest-sensitivity action in the system — always audited.
    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'ADMIN_USER_CREATED',
      targetEntity: adminUser.id,
      category: 'SYSTEM',
      metadata: { newAdminEmail: data.email, newAdminName: data.name, assignedRole: newRole },
    });

    return adminUser;
  }

  async update(id: string, data: any, admin?: { adminUserId?: string | null; adminRole?: string | null }) {
    const existing = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Admin user not found');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = toEnumRole(data.role) as any;
    if (data.status) updateData.status = toEnumStatus(data.status) as any;
    if (data.department) updateData.department = data.department;

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: updateData,
    });

    // A role or status change on an admin account is a privilege/access
    // change and must always be traceable to who made it.
    await logAdminAction(this.prisma, {
      adminId: admin?.adminUserId,
      adminRole: admin?.adminRole,
      action: 'ADMIN_USER_UPDATED',
      targetEntity: id,
      category: 'SYSTEM',
      metadata: {
        targetAdminEmail: existing.email,
        changes: updateData,
        previousRole: existing.role,
        previousStatus: existing.status,
      },
    });

    return updated;
  }
}
