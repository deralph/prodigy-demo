import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffLoansService {
  constructor(private prisma: PrismaService) {}

  // Admin: get all corporate entities with their loans
  async getAllCorporateEntities() {
    return this.prisma.corporateEntity.findMany({
      include: {
        staffLoans: {
          include: { repayments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Admin: get staff loans for a specific entity
  async getEntityLoans(entityId: string) {
    const entity = await this.prisma.corporateEntity.findUnique({
      where: { id: entityId },
      include: {
        staffLoans: {
          include: { repayments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!entity) throw new NotFoundException('Corporate entity not found');
    return entity;
  }

  // Client (corporate): get own entity's staff loans
  async getMyEntityLoans(clientDbId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.staffLoan.findMany({
      where: { clientId: clientDbId },
      include: { repayments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id },
      include: { corporate: true, repayments: true },
    });
    if (!loan) throw new NotFoundException('Staff loan not found');
    return loan;
  }
}
