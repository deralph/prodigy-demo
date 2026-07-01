import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async findAll(query: { search?: string; type?: string; status?: string }) {
    return this.prisma.client.findMany({
      where: {
        ...(query.type && { type: query.type as any }),
        ...(query.status && { status: query.status as any }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { clientRef: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { kycRecord: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { clientRef: clientId },
      // NOTE: deliberately NOT including kycDocuments here — those contain
      // sensitive identity-document references and must only be reachable
      // through the dedicated, role-gated, audited KYC endpoints
      // (KycController.getClientKyc), not the general client profile view
      // which every admin sub-role can call.
      include: { kycRecord: true, investments: true, riskProfile: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async updateStatus(clientId: string, status: string, adminId: string, admin?: { adminRole?: string | null }) {
    const client = await this.prisma.client.findUnique({ where: { clientRef: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    const updated = await this.prisma.client.update({
      where: { id: client.id },
      data: { status: status as any },
    });

    await logAdminAction(this.prisma, {
      adminId,
      adminRole: admin?.adminRole,
      action: 'CLIENT_STATUS_CHANGED',
      targetEntity: client.id,
      category: 'OPERATIONS',
      metadata: { clientRef: client.clientRef, previousStatus: client.status, newStatus: status },
    });

    return updated;
  }

  async updateMandateByClientRef(
    clientId: string,
    mandateType: 'AND' | 'OR',
    admin: { adminId?: string; adminRole?: string | null },
  ) {
    if (mandateType !== 'AND' && mandateType !== 'OR') {
      throw new BadRequestException('Mandate type must be AND or OR.');
    }
    const client = await this.prisma.client.findUnique({ where: { clientRef: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    const previousMandate = client.mandateType;
    const updated = await this.prisma.client.update({
      where: { id: client.id },
      data: { mandateType },
    });

    // Mandate changes gate whether a withdrawal needs single- or
    // dual-holder authorization, so every change must leave an audit trail.
    await logAdminAction(this.prisma, {
      adminId: admin.adminId,
      adminRole: admin.adminRole,
      action: 'MANDATE_TYPE_CHANGED',
      targetEntity: client.id,
      category: 'COMPLIANCE',
      metadata: { previousMandate, newMandate: mandateType },
    });

    // Both holders are notified — this is security-relevant and neither
    // holder should be surprised by a change to how withdrawals work.
    const changedByLabel = admin.adminRole ? `the ${admin.adminRole.replace('_', ' ').toLowerCase()} team` : 'compliance';
    this.notifications.sendMandateChangedEmail(client.email, client.name, mandateType, changedByLabel).catch(() => {});
    if (client.secondaryEmail) {
      this.notifications.sendMandateChangedEmail(client.secondaryEmail, client.secondaryName || 'Co-holder', mandateType, changedByLabel).catch(() => {});
    }

    return updated;
  }

  async getMe(clientDbId: string) {
    return this.prisma.client.findUnique({
      where: { id: clientDbId },
      include: { kycRecord: true, riskProfile: true },
    });
  }
}
