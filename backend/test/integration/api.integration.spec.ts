/**
 * Integration Tests — HTTP layer
 * Spins up the full NestJS app with PrismaService mocked.
 * Tests every major endpoint: status codes, shapes, auth guards, role guards.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../helpers/mock-prisma';
import { makeAccessToken, makeAdminToken, setTestJwtEnv } from '../helpers/jwt.helper';
import * as bcrypt from 'bcrypt';

describe('API Integration Tests', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createMockPrisma>;
  let userToken: string;
  let adminToken: string;

  beforeAll(() => {
    setTestJwtEnv();
    userToken  = makeAccessToken();
    adminToken = makeAdminToken();
  });

  beforeEach(async () => {
    prisma = createMockPrisma();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    setupUserAuth(); // Default to user auth
  });

  afterEach(async () => {
    await app.close();
  });

  // Helper: set up auth for regular user
  function setupUserAuth() {
    // JWT strategy validates by calling prisma.authUser.findUnique with select: { id, isActive, clientId }
    prisma.authUser.findUnique.mockResolvedValue({
      id: IDS.AUTH_USER, isActive: true, clientId: IDS.CLIENT_DB, adminUserId: null,
    } as any);
  }

  // Helper: set up auth for admin user
  function setupAdminAuth() {
    prisma.authUser.findUnique.mockResolvedValue({
      id: IDS.ADMIN_AUTH, isActive: true, clientId: null, adminUserId: IDS.ADMIN_USER,
      adminUser: { status: 'ACTIVE' },
    } as any);
  }

  // ════════════════════════════════════════════════════════════════
  // AUTH ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('POST /api/v1/auth/register/individual', () => {
    it('201 — registers a new individual account', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null); // email not taken
      prisma.client.count.mockResolvedValueOnce(0);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { create: jest.fn().mockResolvedValue({ ...MOCK.client, clientRef: 'CLI-001' }) },
        authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
        kycRecord: { create: jest.fn().mockResolvedValue({}) },
        identityVerification: { create: jest.fn().mockResolvedValue({}) },
      }));

      await request(app.getHttpServer())
        .post('/api/v1/auth/register/individual')
        .send({ accountType: 'single', primaryName: 'John Doe', email: 'new@example.com', password: 'Test1234!', bvn: '22345678901' })
        .expect(201)
        .expect(res => {
          expect(res.body.clientRef).toBe('CLI-001');
          expect(res.body.message).toMatch(/created/i);
        });
    });

    it('409 — duplicate email returns ConflictException', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(MOCK.authUser as any);
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/individual')
        .send({ accountType: 'single', primaryName: 'Dupe', email: 'john@example.com', password: 'Test1234!', bvn: '22345678901' })
        .expect(409);
    });

    it('400 — invalid body (missing required fields)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/individual')
        .send({ email: 'bad@example.com' }) // missing accountType, primaryName, password
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/register/corporate', () => {
    it('201 — registers a new corporate account', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(0);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { create: jest.fn().mockResolvedValue({ ...MOCK.corporateClient, clientRef: 'CLI-002' }) },
        authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
        kycRecord: { create: jest.fn().mockResolvedValue({}) },
      }));

      await request(app.getHttpServer())
        .post('/api/v1/auth/register/corporate')
        .send({ entityName: 'Acme Corp', email: 'corp@acme.com', password: 'Test1234!' })
        .expect(201)
        .expect(res => expect(res.body.clientRef).toBe('CLI-002'));
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('200 — returns tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('Test1234!', 10);
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, passwordHash: hash, client: MOCK.client, adminUser: null,
      } as any);
      prisma.authUser.update.mockResolvedValue({} as any);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'Test1234!' })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.role).toBe('individual');
        });
    });

    it('401 — wrong password', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, passwordHash: await bcrypt.hash('RealPass!', 10),
        client: MOCK.client, adminUser: null,
      } as any);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'WrongPass!' })
        .expect(401);
    });

    it('401 — user does not exist', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'Test1234!' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('200 — returns current user when authenticated', async () => {
      prisma.authUser.findUnique
        .mockResolvedValueOnce({ ...MOCK.authUser, isActive: true, clientId: IDS.CLIENT_DB }) // JWT strategy
        .mockResolvedValueOnce({ ...MOCK.authUser, client: MOCK.client, adminUser: null } as any); // getMe call

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(res => expect(res.body.email).toBe('john@example.com'));
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('201 — clears refresh token', async () => {
      prisma.authUser.update.mockResolvedValue({} as any);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201)
        .expect(res => expect(res.body.message).toMatch(/logged out/i));
    });
  });

  // ════════════════════════════════════════════════════════════════
  // CLIENT ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/clients/me', () => {
    it('200 — returns own client profile', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      await request(app.getHttpServer())
        .get('/api/v1/clients/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(res => expect(res.body.clientRef).toBe('CLI-001'));
    });

    it('401 — no token', async () => {
      await request(app.getHttpServer()).get('/api/v1/clients/me').expect(401);
    });
  });

  describe('PATCH /api/v1/admin/clients/:clientId/mandate', () => {
    it('200 — compliance admin can update mandate type for a joint account', async () => {
      const complianceToken = makeAdminToken({ adminRole: 'COMPLIANCE' });
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.client.update.mockResolvedValueOnce({ ...MOCK.client, mandateType: 'OR' } as any);
      prisma.auditLog.create.mockResolvedValueOnce({} as any);
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/clients/${MOCK.client.clientRef}/mandate`)
        .set('Authorization', `Bearer ${complianceToken}`)
        .send({ mandateType: 'OR' })
        .expect(200);
    });

    it('403 — a non-compliance admin role cannot update mandate type', async () => {
      const financeToken = makeAdminToken({ adminRole: 'FINANCE' });
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/clients/${MOCK.client.clientRef}/mandate`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ mandateType: 'OR' })
        .expect(403);
    });

    it('403 — a regular client cannot update their own mandate', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/clients/${MOCK.client.clientRef}/mandate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ mandateType: 'OR' })
        .expect(403);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // KYC ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/kyc/me', () => {
    it('200 — returns KYC status and document list', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'INDIVIDUAL', kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);

      await request(app.getHttpServer())
        .get('/api/v1/kyc/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.documents).toHaveLength(5);
          expect(res.body.documents[0]).toHaveProperty('key');
          expect(res.body.documents[0]).toHaveProperty('status');
        });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // WALLET ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/wallet/me', () => {
    it('200 — returns wallet balance', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        walletBalance: BigInt(500_000),
        pendingBalance: BigInt(0),
        virtualAccountNo: '0123456789',
        virtualAccountBank: 'Prodigy MFB',
      } as any);

      await request(app.getHttpServer())
        .get('/api/v1/wallet/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(res => expect(res.body).toHaveProperty('walletBalance'));
    });
  });

  describe('GET /api/v1/wallet/me/transactions', () => {
    it('200 — returns transaction history with pagination', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([MOCK.walletTx] as any);
      prisma.walletTransaction.count.mockResolvedValueOnce(1);
      await request(app.getHttpServer())
        .get('/api/v1/wallet/me/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(res => expect(res.body).toHaveProperty('data'))
        .expect(res => expect(Array.isArray(res.body.data)).toBe(true))
        .expect(res => expect(res.body).toHaveProperty('total'))
        .expect(res => expect(res.body).toHaveProperty('page'))
        .expect(res => expect(res.body).toHaveProperty('limit'));
    });
  });

  describe('POST /api/v1/wallet/withdraw', () => {
    it('201 — creates withdrawal request (auto-executes for individual client)', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      // Second call in executeWithdrawal for individual client
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      // JWT strategy validation (first call to findUnique)
      prisma.authUser.findUnique.mockResolvedValueOnce({
        id: IDS.AUTH_USER, isActive: true, clientId: IDS.CLIENT_DB, adminUserId: null, adminUser: null,
      } as any);
      // executeWithdrawal first findUnique call
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: 'cuid-auth-001', holderType: 'PRIMARY', email: 'john@example.com' } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        walletTransaction: { create: jest.fn().mockResolvedValue({ status: 'SUCCESSFUL', amountKobo: BigInt(50_000_00), transferCode: 'AUTO-123' }) },
      }));
      // executeWithdrawal second findUnique call
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: 'cuid-auth-001', holderType: 'PRIMARY', email: 'john@example.com' } as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amountKobo: 50000, bankName: 'GTBank', bankAcctNo: '0123456789', bankAcctName: 'John Doe' })
        .expect(201)
        .expect(res => expect(res.body.status).toBe('SUCCESSFUL'));
    });
  });

  // ════════════════════════════════════════════════════════════════
  // INVESTMENT ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/investments/me', () => {
    it('200 — returns client investments', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([MOCK.investment] as any);
      await request(app.getHttpServer())
        .get('/api/v1/investments/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(res => expect(Array.isArray(res.body)).toBe(true));
    });
  });

  describe('POST /api/v1/investments/subscribe', () => {
    it('201 — creates investment in PENDING_APPROVAL state', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(0);
      prisma.client.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic debit
      prisma.walletTransaction.create.mockResolvedValueOnce({ txnRef: 'WAL-SUB-123' } as any);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'PENDING_APPROVAL', product: MOCK.product,
      } as any);
      prisma.approval.create.mockResolvedValueOnce({} as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .post('/api/v1/investments/subscribe')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: IDS.PRODUCT,
          principalKobo: '50000000',
          tenorDays: 90,
          valueDate: '2024-06-01T00:00:00.000Z',
        })
        .expect(201)
        .expect(res => expect(res.body.status).toBe('PENDING_APPROVAL'));
    });
  });

  // ════════════════════════════════════════════════════════════════
  // PRODUCTS ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('GET /api/v1/products', () => {
    it('200 — returns active products (public)', async () => {
      prisma.product.findMany.mockResolvedValueOnce([MOCK.product] as any);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('name');
        });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ════════════════════════════════════════════════════════════════
  describe('Admin — Clients', () => {
    beforeEach(() => {
      // Override: admin token JWT strategy lookup
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
      } as any);
    });

    it('GET /api/v1/admin/clients — 200 with admin token', async () => {
      prisma.client.findMany.mockResolvedValueOnce([MOCK.client] as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(res => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /api/v1/admin/clients — 403 with regular user token', async () => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.AUTH_USER, isActive: true, clientId: IDS.CLIENT_DB,
      } as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('GET /api/v1/admin/clients/:id — 200 returns single client', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, investments: [], kycDocuments: [],
      } as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/clients/CLI-001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('PATCH /api/v1/admin/clients/:id/status — 200 updates client status', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.client.update.mockResolvedValueOnce({ ...MOCK.client, status: 'SUSPENDED' } as any);
      await request(app.getHttpServer())
        .patch('/api/v1/admin/clients/CLI-001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' })
        .expect(200);
    });
  });

  describe('Admin — Investments', () => {
    beforeEach(() => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
      } as any);
    });

    it('GET /api/v1/admin/investments — 200 returns all investments', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([MOCK.investment] as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/investments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(res => expect(Array.isArray(res.body)).toBe(true));
    });

    it('POST /api/v1/admin/investments/book — 201 books investment for client', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(0);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'ACTIVE', product: MOCK.product, client: MOCK.client,
      } as any);

      await request(app.getHttpServer())
        .post('/api/v1/admin/investments/book')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientRef: 'CLI-001',
          productId: IDS.PRODUCT,
          principalKobo: '500000000',
          roiRate: 16,
          tenorDays: 180,
          valueDate: '2024-01-01T00:00:00.000Z',
        })
        .expect(201)
        .expect(res => expect(res.body.status).toBe('ACTIVE'));
    });
  });

  describe('Admin — Approvals', () => {
    beforeEach(() => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
      } as any);
    });

    it('GET /api/v1/admin/approvals — 200 returns pending approvals', async () => {
      prisma.approval.findMany.mockResolvedValueOnce([MOCK.approval] as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/approvals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(res => expect(Array.isArray(res.body)).toBe(true));
    });

    it('POST /api/v1/admin/approvals/:id/approve — 201 approves item', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic claim
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'OTHER', status: 'APPROVED' } as any);

      await request(app.getHttpServer())
        .post(`/api/v1/admin/approvals/${IDS.APPROVAL}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'All good' })
        .expect(201)
        .expect(res => expect(res.body.status).toBe('APPROVED'));
    });

    it('POST /api/v1/admin/approvals/:id/reject — 201 rejects item', async () => {
      prisma.approval.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic claim
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'OTHER', status: 'REJECTED' } as any);

      await request(app.getHttpServer())
        .post(`/api/v1/admin/approvals/${IDS.APPROVAL}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Docs incomplete' })
        .expect(201)
        .expect(res => expect(res.body.status).toBe('REJECTED'));
    });
  });

  describe('Admin — KYC Compliance Board', () => {
    beforeEach(() => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
      } as any);
    });

    it('GET /api/v1/kyc/compliance-board — 200 returns clients with KYC', async () => {
      prisma.client.findMany.mockResolvedValueOnce([
        { ...MOCK.client, kycRecord: MOCK.kycRecord, kycDocuments: [] },
      ] as any);

      await request(app.getHttpServer())
        .get('/api/v1/kyc/compliance-board')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(res => expect(Array.isArray(res.body)).toBe(true));
    });

    it('POST /api/v1/kyc/:clientId/approve — 201 approves KYC', async () => {
      prisma.kycRecord.update.mockResolvedValueOnce({} as any);
      prisma.client.update.mockResolvedValueOnce({} as any);
      prisma.kycDocument.updateMany.mockResolvedValueOnce({ count: 3 } as any);

      await request(app.getHttpServer())
        .post(`/api/v1/kyc/${IDS.CLIENT_DB}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect(res => expect(res.body.message).toMatch(/approved/i));
    });

    it('POST /api/v1/kyc/:clientId/reject — 201 rejects KYC with reason', async () => {
      prisma.kycRecord.update.mockResolvedValueOnce({} as any);
      prisma.client.update.mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .post(`/api/v1/kyc/${IDS.CLIENT_DB}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'ID is expired' })
        .expect(201)
        .expect(res => expect(res.body.message).toMatch(/rejected/i));
    });

    it('GET /api/v1/kyc/compliance-board — 403 for a FINANCE admin (not permitted to view KYC/PII)', async () => {
      const financeToken = makeAdminToken({ adminRole: 'FINANCE' });
      await request(app.getHttpServer())
        .get('/api/v1/kyc/compliance-board')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(403);
    });

    it('GET /api/v1/kyc/client/:clientId — 200 for an OPERATIONS admin (permitted role)', async () => {
      const opsToken = makeAdminToken({ adminRole: 'OPERATIONS' });
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'INDIVIDUAL', kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);
      prisma.auditLog.create.mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .get(`/api/v1/kyc/client/${IDS.CLIENT_DB}`)
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);
    });
  });

  describe('Admin — Transactions', () => {
    beforeEach(() => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
      } as any);
    });

    it('GET /api/v1/admin/transactions — 200 returns all transactions', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([MOCK.walletTx] as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/v1/admin/transactions — 403 for non-admin', async () => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.AUTH_USER, isActive: true, clientId: IDS.CLIENT_DB,
      } as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // SECURITY — 401 / 403 GUARDS
  // ════════════════════════════════════════════════════════════════
  describe('Security Guards', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/v1/clients/me' },
      { method: 'get', path: '/api/v1/kyc/me' },
      { method: 'get', path: '/api/v1/wallet/me' },
      { method: 'get', path: '/api/v1/investments/me' },
    ];

    protectedRoutes.forEach(({ method, path }) => {
      it(`401 ${method.toUpperCase()} ${path} without token`, async () => {
        await (request(app.getHttpServer()) as any)[method](path).expect(401);
      });
    });

    const adminOnlyRoutes = [
      '/api/v1/admin/clients',
      '/api/v1/admin/investments',
      '/api/v1/admin/approvals',
      '/api/v1/admin/transactions',
      '/api/v1/kyc/compliance-board',
      '/api/v1/admin/audit',
    ];

    adminOnlyRoutes.forEach(path => {
      it(`403 GET ${path} with non-admin token`, async () => {
        prisma.authUser.findUnique.mockResolvedValue({
          id: IDS.AUTH_USER, isActive: true, clientId: IDS.CLIENT_DB,
        } as any);
        await request(app.getHttpServer())
          .get(path)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    it('403 GET /api/v1/admin/audit with a FINANCE admin (not permitted — audit trail is compliance/audit/super-admin only)', async () => {
      const financeToken = makeAdminToken({ adminRole: 'FINANCE' });
      await request(app.getHttpServer())
        .get('/api/v1/admin/audit')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(403);
    });

    it('200 GET /api/v1/admin/audit with an AUDIT admin (permitted role)', async () => {
      const auditToken = makeAdminToken({ adminRole: 'AUDIT' });
      prisma.auditLog.findMany.mockResolvedValueOnce([]);
      prisma.auditLog.count.mockResolvedValueOnce(0);
      await request(app.getHttpServer())
        .get('/api/v1/admin/audit')
        .set('Authorization', `Bearer ${auditToken}`)
        .expect(200);
    });

    it('403 POST /api/v1/admin-users with a regular (non-admin) client token — closes a privilege-escalation hole that previously let any logged-in user create a SUPER_ADMIN account', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin-users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacker', email: 'hacker@evil.com', role: 'super_admin', password: 'Valid1234' })
        .expect(403);
    });

    it('403 POST /api/v1/admin-users with a non-super-admin (e.g. OPERATIONS) — admin user management is super-admin only', async () => {
      const opsToken = makeAdminToken({ adminRole: 'OPERATIONS' });
      await request(app.getHttpServer())
        .post('/api/v1/admin-users')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({ name: 'New Admin', email: 'new-admin@prodigy.ng', role: 'finance', password: 'Valid1234' })
        .expect(403);
    });

    it('201 POST /api/v1/admin-users with a SUPER_ADMIN token succeeds', async () => {
      // First findUnique = JWT strategy re-validation (admin user), second = email-not-taken check
      prisma.authUser.findUnique
        .mockResolvedValueOnce({
          id: IDS.ADMIN_AUTH, isActive: true, clientId: null, adminUserId: IDS.ADMIN_USER, adminUser: { status: 'ACTIVE' },
        } as any)
        .mockResolvedValueOnce(null);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        adminUser: { create: jest.fn().mockResolvedValue({ id: 'new-1', email: 'new-admin@prodigy.ng', name: 'New Admin', role: 'FINANCE' }) },
        authUser: { create: jest.fn().mockResolvedValue({}) },
      }));
      await request(app.getHttpServer())
        .post('/api/v1/admin-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Admin', email: 'new-admin@prodigy.ng', role: 'finance', password: 'Valid1234' })
        .expect(201);
    });

    it('403 GET /api/v1/admin-users with a non-super-admin token', async () => {
      const financeToken = makeAdminToken({ adminRole: 'FINANCE' });
      await request(app.getHttpServer())
        .get('/api/v1/admin-users')
        .set('Authorization', `Bearer ${financeToken}`)
        .expect(403);
    });

    it('401 admin endpoint when the admin AdminUser profile is LOCKED — revocation is enforced on every request', async () => {
      // JWT strategy now re-checks the DB: admin tokens require a live,
      // ACTIVE AdminUser profile, so a lock takes effect immediately.
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
        adminUserId: IDS.ADMIN_USER, adminUser: { status: 'LOCKED' },
      } as any);
      await request(app.getHttpServer())
        .get('/api/v1/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(401);
    });

    it('401 protected route when the AuthUser is deactivated (isActive=false)', async () => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: IDS.AUTH_USER, isActive: false, clientId: IDS.CLIENT_DB, adminUserId: null,
      } as any);
      await request(app.getHttpServer())
        .get('/api/v1/clients/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);
    });
  });
});
