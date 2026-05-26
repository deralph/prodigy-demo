import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GoalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  findAll(clientDbId: string) {
    return this.prisma.goal.findMany({
      where: { clientId: clientDbId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(clientDbId: string, dto: { name: string; targetAmountKobo: bigint; targetDate?: Date; notes?: string }) {
    return this.prisma.goal.create({
      data: { clientId: clientDbId, ...dto },
    });
  }

  async update(clientDbId: string, goalId: string, patch: Partial<{ name: string; targetAmountKobo: bigint; targetDate: Date; notes: string; status: GoalStatus }>) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.clientId !== clientDbId) throw new ForbiddenException();
    return this.prisma.goal.update({ where: { id: goalId }, data: patch });
  }

  async remove(clientDbId: string, goalId: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.clientId !== clientDbId) throw new ForbiddenException();
    return this.prisma.goal.delete({ where: { id: goalId } });
  }
}
