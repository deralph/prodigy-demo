import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KYC_REQUIREMENTS } from './kyc.constants';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async getMyKyc(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { kycRecord: true, kycDocuments: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    const requirements = KYC_REQUIREMENTS[client.type.toLowerCase()] ?? [];

    return {
      kycRecord: client.kycRecord,
      documents: requirements.map((req) => {
        const doc = client.kycDocuments.find((d) => d.docKey === req.key);
        return {
          key: req.key,
          label: req.label,
          required: req.required,
          status: doc?.status ?? 'NOT_UPLOADED',
          fileUrl: doc?.fileUrl ?? null,
          fileName: doc?.fileName ?? null,
          uploadedAt: doc?.uploadedAt ?? null,
          rejectionReason: doc?.rejectionReason ?? null,
        };
      }),
    };
  }

  async uploadDocument(
    clientId: string,
    docKey: string,
    file: Express.Multer.File,
    fileUrl: string,
  ) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    const requirements = KYC_REQUIREMENTS[client.type.toLowerCase()] ?? [];
    const req = requirements.find((r) => r.key === docKey);
    if (!req) throw new BadRequestException(`Unknown document key: ${docKey}`);

    const doc = await this.prisma.kycDocument.upsert({
      where: { clientId_docKey: { clientId, docKey } },
      create: {
        clientId,
        docKey,
        label: req.label,
        fileUrl,
        fileName: file.originalname,
        fileMimeType: file.mimetype,
        fileSizeBytes: file.size,
        status: 'UPLOADED',
        uploadedAt: new Date(),
      },
      update: {
        fileUrl,
        fileName: file.originalname,
        fileMimeType: file.mimetype,
        fileSizeBytes: file.size,
        status: 'UPLOADED',
        uploadedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Check if all required docs are now uploaded → set status to KYC_SUBMITTED
    await this.checkAndSubmitKyc(clientId, client.type.toLowerCase());

    return doc;
  }

  async uploadAllDocuments(
    clientId: string,
    files: Record<string, Express.Multer.File>,
    fileUrls: Record<string, string>,
  ) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    const requirements = KYC_REQUIREMENTS[client.type.toLowerCase()] ?? [];
    const missing = requirements.filter((r) => r.required && !files[r.key]);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required documents: ${missing.map((m) => m.label).join(', ')}`,
      );
    }

    for (const req of requirements) {
      if (files[req.key]) {
        await this.prisma.kycDocument.upsert({
          where: { clientId_docKey: { clientId, docKey: req.key } },
          create: {
            clientId,
            docKey: req.key,
            label: req.label,
            fileUrl: fileUrls[req.key],
            fileName: files[req.key].originalname,
            fileMimeType: files[req.key].mimetype,
            fileSizeBytes: files[req.key].size,
            status: 'UPLOADED',
            uploadedAt: new Date(),
          },
          update: {
            fileUrl: fileUrls[req.key],
            fileName: files[req.key].originalname,
            status: 'UPLOADED',
            uploadedAt: new Date(),
            rejectionReason: null,
          },
        });
      }
    }

    await this.checkAndSubmitKyc(clientId, client.type.toLowerCase());
    return { message: 'All documents uploaded and KYC submitted for review.' };
  }

  private async checkAndSubmitKyc(clientId: string, type: string) {
    const requirements = KYC_REQUIREMENTS[type] ?? [];
    const requiredKeys = requirements.filter((r) => r.required).map((r) => r.key);
    const uploaded = await this.prisma.kycDocument.findMany({
      where: { clientId, docKey: { in: requiredKeys }, status: { in: ['UPLOADED', 'VERIFIED'] } },
    });
    if (uploaded.length >= requiredKeys.length) {
      await this.prisma.client.update({
        where: { id: clientId },
        data: { status: 'KYC_SUBMITTED' },
      });
      await this.prisma.kycRecord.update({
        where: { clientId },
        data: { status: 'PENDING', submittedAt: new Date() },
      });
    }
  }

  // Admin: get compliance board
  async getComplianceBoard() {
    return this.prisma.client.findMany({
      include: { kycRecord: true, kycDocuments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: approve KYC
  async approveKyc(clientId: string, adminId: string) {
    await this.prisma.kycRecord.update({
      where: { clientId },
      data: { status: 'APPROVED', reviewedById: adminId, reviewedAt: new Date() },
    });
    await this.prisma.client.update({
      where: { id: clientId },
      data: { status: 'ACTIVE' },
    });
    await this.prisma.kycDocument.updateMany({
      where: { clientId, status: 'UPLOADED' },
      data: { status: 'VERIFIED', verifiedById: adminId, verifiedAt: new Date() },
    });
    return { message: 'KYC approved' };
  }

  // Admin: reject KYC
  async rejectKyc(clientId: string, adminId: string, reason: string) {
    await this.prisma.kycRecord.update({
      where: { clientId },
      data: { status: 'REJECTED', reviewedById: adminId, reviewNotes: reason, reviewedAt: new Date() },
    });
    await this.prisma.client.update({
      where: { id: clientId },
      data: { status: 'PENDING_KYC' },
    });
    return { message: 'KYC rejected' };
  }

  // Admin: approve a single KYC document
  async approveDocument(clientId: string, docKey: string, adminId: string) {
    const doc = await this.prisma.kycDocument.update({
      where: { clientId_docKey: { clientId, docKey } },
      data: { status: 'VERIFIED', verifiedById: adminId, verifiedAt: new Date(), rejectionReason: null },
    });
    return doc;
  }

  // Admin: reject a single KYC document
  async rejectDocument(clientId: string, docKey: string, adminId: string, reason: string) {
    const doc = await this.prisma.kycDocument.update({
      where: { clientId_docKey: { clientId, docKey } },
      data: { status: 'REJECTED', verifiedById: adminId, verifiedAt: new Date(), rejectionReason: reason },
    });
    return doc;
  }
}
