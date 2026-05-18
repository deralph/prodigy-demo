import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
          role: data.role as any,
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
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.department) updateData.department = data.department;

    return this.prisma.adminUser.update({
      where: { id },
      data: updateData,
    });
  }
}
