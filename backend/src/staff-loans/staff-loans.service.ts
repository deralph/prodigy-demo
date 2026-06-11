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

  // Client (corporate): submit a new staff loan application
  async applyLoan(clientDbId: string, dto: {
    staffName: string;
    staffEmail?: string;
    department?: string;
    amount: number;
    term: number;
    purpose?: string;
  }) {
    const client = await this.prisma.client.findUnique({ where: { id: clientDbId } });
    if (!client) throw new NotFoundException('Client not found');

    // Find or create CorporateEntity linked to this client
    let entity = await this.prisma.corporateEntity.findFirst({ where: { clientId: clientDbId } });
    if (!entity) {
      const count = await this.prisma.corporateEntity.count();
      entity = await this.prisma.corporateEntity.create({
        data: {
          entityRef: `CE-${String(count + 1).padStart(4, '0')}`,
          name: client.name,
          clientId: clientDbId,
        },
      });
    }

    const principalKobo = BigInt(Math.round(dto.amount * 100));
    const interestRate  = 1.5;
    const totalRepay    = Number(principalKobo) * 1.015;
    const monthly       = BigInt(Math.round(totalRepay / dto.term));
    const loanRef       = `LN-${Date.now()}`;

    return this.prisma.staffLoan.create({
      data: {
        loanRef,
        corporateId:        entity.id,
        clientId:           clientDbId,
        staffName:          dto.staffName,
        staffEmail:         dto.staffEmail,
        department:         dto.department,
        principalKobo,
        interestRate,
        tenorMonths:        dto.term,
        monthlyPaymentKobo: monthly,
        outstandingKobo:    BigInt(Math.round(totalRepay)),
        status:             'PENDING',
      },
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
