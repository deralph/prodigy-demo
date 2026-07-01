import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KycService } from './kyc.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';

const mockFile = (fieldname = 'valid_id'): Express.Multer.File => ({
  fieldname,
  originalname: `${fieldname}.pdf`,
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 102400,
  buffer: Buffer.from('fake-pdf-content'),
  destination: '',
  filename: '',
  path: '',
  stream: null as any,
});

describe('KycService', () => {
  let service: KycService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notifications: ReturnType<typeof createMockNotifications>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    notifications = createMockNotifications();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(KycService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getMyKyc ──────────────────────────────────────────────────────
  describe('getMyKyc()', () => {
    it('returns kycRecord and document requirements for INDIVIDUAL', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'INDIVIDUAL', kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);

      const result = await service.getMyKyc(IDS.CLIENT_DB);
      expect(result.kycRecord).toBeDefined();
      expect(result.documents).toHaveLength(5); // 5 individual requirements
      expect(result.documents[0].status).toBe('NOT_UPLOADED');
    });

    it('returns kycRecord and document requirements for CORPORATE', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'CORPORATE', kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);

      const result = await service.getMyKyc(IDS.CLIENT_DB);
      expect(result.documents).toHaveLength(8); // 8 corporate requirements (CAC, MEMART, SCUML, TIN, utility, directors' ID, sig mandate, sig upload)
    });

    it('returns BOTH holders\' document requirements for JOINT accounts (10 total — 5 per holder)', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'JOINT', kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);

      const result = await service.getMyKyc(IDS.CLIENT_DB);
      expect(result.documents).toHaveLength(10);
      expect(result.documents.some((d: any) => d.key === 'valid_id_p1')).toBe(true);
      expect(result.documents.some((d: any) => d.key === 'valid_id_p2')).toBe(true);
    });

    it('returns document status as UPLOADED when document exists', async () => {
      const mockDoc = { docKey: 'valid_id', status: 'UPLOADED', fileUrl: 'https://cdn.cloudinary.com/test.pdf', fileName: 'valid_id.pdf', uploadedAt: new Date(), rejectionReason: null };
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'INDIVIDUAL', kycRecord: MOCK.kycRecord, kycDocuments: [mockDoc],
      } as any);

      const result = await service.getMyKyc(IDS.CLIENT_DB);
      const doc = result.documents.find(d => d.key === 'valid_id');
      expect(doc!.status).toBe('UPLOADED');
      expect(doc!.fileUrl).toBe('https://cdn.cloudinary.com/test.pdf');
    });

    it('throws NotFoundException when client not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.getMyKyc('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── uploadDocument ────────────────────────────────────────────────
  describe('uploadDocument()', () => {
    it('upserts KYC document record', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, type: 'INDIVIDUAL' } as any);
      prisma.kycDocument.upsert.mockResolvedValueOnce({ docKey: 'valid_id', status: 'UPLOADED' } as any);
      prisma.kycDocument.findMany.mockResolvedValueOnce([]); // not all uploaded yet

      const result = await service.uploadDocument(IDS.CLIENT_DB, 'valid_id', mockFile(), 'https://cloudinary.com/doc.pdf');
      expect(result.status).toBe('UPLOADED');
      expect(prisma.kycDocument.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ docKey: 'valid_id' }) }),
      );
    });

    it('throws BadRequestException for unknown document key', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, type: 'INDIVIDUAL' } as any);
      await expect(service.uploadDocument(IDS.CLIENT_DB, 'unknown_key', mockFile(), 'url')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when client not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.uploadDocument('bad', 'valid_id', mockFile(), 'url')).rejects.toThrow(NotFoundException);
    });

    it('updates client status to KYC_SUBMITTED when all required docs uploaded', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, type: 'INDIVIDUAL' } as any);
      prisma.kycDocument.upsert.mockResolvedValueOnce({ docKey: 'valid_id', status: 'UPLOADED' } as any);
      // All 5 required docs uploaded
      prisma.kycDocument.findMany.mockResolvedValueOnce([
        { docKey: 'valid_id' }, { docKey: 'nin' }, { docKey: 'passport_photo' },
        { docKey: 'sig_sample' }, { docKey: 'utility_bill' },
      ] as any);
      prisma.client.update.mockResolvedValueOnce({} as any);
      prisma.kycRecord.update.mockResolvedValueOnce({} as any);

      await service.uploadDocument(IDS.CLIENT_DB, 'valid_id', mockFile(), 'url');
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'KYC_SUBMITTED' } }),
      );
    });
  });

  // ── approveKyc ────────────────────────────────────────────────────
  describe('approveKyc()', () => {
    it('sets kycRecord APPROVED, client ACTIVE, and verifies all documents', async () => {
      prisma.kycRecord.update.mockResolvedValueOnce({} as any);
      prisma.client.update.mockResolvedValueOnce({} as any);
      prisma.kycDocument.updateMany.mockResolvedValueOnce({ count: 2 } as any);

      const result = await service.approveKyc(IDS.CLIENT_DB, IDS.ADMIN_USER);
      expect(result.message).toMatch(/approved/i);
      expect(prisma.kycRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED' }) }),
      );
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACTIVE' } }),
      );
    });
  });

  // ── rejectKyc ────────────────────────────────────────────────────
  describe('rejectKyc()', () => {
    it('sets kycRecord REJECTED, client PENDING_KYC', async () => {
      prisma.kycRecord.update.mockResolvedValueOnce({} as any);
      prisma.client.update.mockResolvedValueOnce({} as any);

      const result = await service.rejectKyc(IDS.CLIENT_DB, IDS.ADMIN_USER, 'Document unclear');
      expect(result.message).toMatch(/rejected/i);
      expect(prisma.kycRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED', reviewNotes: 'Document unclear' }) }),
      );
    });
  });

  // ── getComplianceBoard ────────────────────────────────────────────
  describe('getComplianceBoard()', () => {
    it('returns all clients with kycRecord and kycDocuments', async () => {
      prisma.client.findMany.mockResolvedValueOnce([
        { ...MOCK.client, kycRecord: MOCK.kycRecord, kycDocuments: [] },
      ] as any);
      const result = await service.getComplianceBoard();
      expect(result).toHaveLength(1);
      expect(result[0].kycRecord).toBeDefined();
    });
  });
});
