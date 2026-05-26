/**
 * System / E2E Tests — Full user journeys
 * Tests complete multi-step flows that simulate real usage:
 *   - Client registers → logs in → checks KYC → subscribes to investment
 *   - Admin logs in → views clients → approves KYC → books investment → approves
 *   - Wallet funding → withdrawal → statement
 *   - Goals lifecycle
 *   - Corporate registration → profile management
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../helpers/mock-prisma';
import { makeAccessToken, makeAdminToken, setTestJwtEnv } from '../helpers/jwt.helper';

describe('System E2E Tests', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    setTestJwtEnv();
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
  });

  afterAll(() => app.close());

  // Helper: set up JWT strategy to pass for a user token
  function setupUserAuth() {
    prisma.authUser.findUnique.mockResolvedValue({
      id: IDS.AUTH_USER, isActive: true, clientId: IDS.CLIENT_DB,
    } as any);
  }

  function setupAdminAuth() {
    prisma.authUser.findUnique.mockResolvedValue({
      id: IDS.ADMIN_AUTH, isActive: true, clientId: null,
    } as any);
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 1: Individual Client Registration → Login → Profile
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 1: Individual Client Registration & Login', () => {
    it('Step 1: registers new individual account', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(0);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client:   { create: jest.fn().mockResolvedValue({ ...MOCK.client, clientRef: 'CLI-001' }) },
        authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
        kycRecord:{ create: jest.fn().mockResolvedValue({}) },
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/individual')
        .send({ accountType: 'single', primaryName: 'John Doe', email: 'john@example.com', password: 'Test1234!' });

      expect(res.status).toBe(201);
      expect(res.body.clientRef).toBe('CLI-001');
      expect(res.body.message).toContain('created');
    });

    it('Step 2: logs in with correct credentials', async () => {
      const hash = await bcrypt.hash('Test1234!', 10);
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, passwordHash: hash, client: MOCK.client, adminUser: null,
      } as any);
      prisma.authUser.update.mockResolvedValue({} as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'Test1234!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.role).toBe('individual');
    });

    it('Step 3: views own profile', async () => {
      setupUserAuth();
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, kycRecord: MOCK.kycRecord, riskProfile: null,
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/clients/me')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('John Doe');
      expect(res.body.status).toBe('ACTIVE');
    });

    it('Step 4: checks KYC status — all docs NOT_UPLOADED initially', async () => {
      setupUserAuth();
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'INDIVIDUAL', kycRecord: { ...MOCK.kycRecord, status: 'NOT_STARTED' }, kycDocuments: [],
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/kyc/me')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.documents).toHaveLength(5);
      expect(res.body.documents.every((d: any) => d.status === 'NOT_UPLOADED')).toBe(true);
    });

    it('Step 5: cannot invest before KYC is active', async () => {
      setupUserAuth();
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, status: 'PENDING_KYC',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/investments/subscribe')
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ productId: IDS.PRODUCT, principalKobo: '200000000', tenorDays: 90, valueDate: '2024-06-01T00:00:00.000Z' });

      expect(res.status).toBe(403);
    });

    it('Step 6: subscribes to investment after KYC approval', async () => {
      setupUserAuth();
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any); // status: ACTIVE
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(0);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'PENDING_APPROVAL', product: MOCK.product,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/investments/subscribe')
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ productId: IDS.PRODUCT, principalKobo: '200000000', tenorDays: 90, valueDate: '2024-06-01T00:00:00.000Z' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING_APPROVAL');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 2: Joint Account Registration
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 2: Joint Account Registration', () => {
    it('registers a joint account with two holders', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(5);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client:   { create: jest.fn().mockResolvedValue({ ...MOCK.client, clientRef: 'CLI-006', type: 'JOINT', secondaryName: 'Jane Doe' }) },
        authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
        kycRecord:{ create: jest.fn().mockResolvedValue({}) },
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/individual')
        .send({ accountType: 'joint', primaryName: 'John Doe', secondaryName: 'Jane Doe', email: 'joint@example.com', password: 'Test1234!' });

      expect(res.status).toBe(201);
      expect(res.body.clientRef).toBe('CLI-006');
    });

    it('joint account has 10 KYC requirements (5 per holder)', async () => {
      setupUserAuth();
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, type: 'JOINT', kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/kyc/me')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.documents).toHaveLength(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 3: Corporate Registration → KYC
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 3: Corporate Registration', () => {
    it('registers a corporate account', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(3);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client:   { create: jest.fn().mockResolvedValue({ ...MOCK.corporateClient, clientRef: 'CLI-004' }) },
        authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
        kycRecord:{ create: jest.fn().mockResolvedValue({}) },
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/corporate')
        .send({ entityName: 'Acme Holdings Ltd', email: 'acme@example.com', password: 'Test1234!', phone: '08099999999' });

      expect(res.status).toBe(201);
      expect(res.body.clientRef).toBe('CLI-004');
    });

    it('corporate client has 5 specific KYC requirements', async () => {
      setupUserAuth();
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.corporateClient, kycRecord: MOCK.kycRecord, kycDocuments: [],
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/kyc/me')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.documents).toHaveLength(5);
      expect(res.body.documents.map((d: any) => d.key)).toContain('cac_cert');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 4: Admin — Full Client & Investment Management
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 4: Admin Client & Investment Management', () => {
    beforeEach(() => setupAdminAuth());

    it('Step 1: admin lists all clients', async () => {
      prisma.client.findMany.mockResolvedValueOnce([MOCK.client, MOCK.corporateClient] as any);
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/clients')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('Step 2: admin searches clients by name', async () => {
      prisma.client.findMany.mockResolvedValueOnce([MOCK.client] as any);
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/clients?search=John')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(prisma.client.findMany).toHaveBeenCalled();
    });

    it('Step 3: admin views KYC compliance board', async () => {
      prisma.client.findMany.mockResolvedValueOnce([
        { ...MOCK.client, kycRecord: { ...MOCK.kycRecord, status: 'PENDING' }, kycDocuments: [] },
      ] as any);
      const res = await request(app.getHttpServer())
        .get('/api/v1/kyc/compliance-board')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body[0].kycRecord.status).toBe('PENDING');
    });

    it('Step 4: admin approves KYC for client', async () => {
      prisma.kycRecord.update.mockResolvedValueOnce({} as any);
      prisma.client.update.mockResolvedValueOnce({} as any);
      prisma.kycDocument.updateMany.mockResolvedValueOnce({ count: 5 } as any);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/kyc/${IDS.CLIENT_DB}/approve`)
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/approved/i);
    });

    it('Step 5: admin books investment for client directly', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.investment.count.mockResolvedValueOnce(10);
      prisma.investment.create.mockResolvedValueOnce({
        ...MOCK.investment, status: 'ACTIVE', investRef: 'INV-0011',
        product: MOCK.product, client: MOCK.client,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/investments/book')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({
          clientRef: 'CLI-001',
          productId: IDS.PRODUCT,
          principalKobo: '500000000',
          roiRate: 16.5,
          tenorDays: 365,
          valueDate: '2024-01-01T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.investRef).toBe('INV-0011');
    });

    it('Step 6: admin views pending approvals', async () => {
      prisma.approval.findMany.mockResolvedValueOnce([MOCK.approval] as any);
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/approvals?status=PENDING')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('Step 7: admin approves a subscription', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT } as any);
      prisma.approval.update.mockResolvedValueOnce({ ...MOCK.approval, status: 'APPROVED' } as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'ACTIVE' } as any);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/approvals/${IDS.APPROVAL}/approve`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ notes: 'Verified and approved' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('APPROVED');
    });

    it('Step 8: admin rejects a subscription with reason', async () => {
      prisma.approval.findUnique.mockResolvedValueOnce({ ...MOCK.approval, type: 'SUBSCRIPTION', investmentId: IDS.INVESTMENT } as any);
      prisma.approval.update.mockResolvedValueOnce({ ...MOCK.approval, status: 'REJECTED' } as any);
      prisma.investment.update.mockResolvedValueOnce({ ...MOCK.investment, status: 'REJECTED' } as any);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/approvals/${IDS.APPROVAL}/reject`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ reason: 'Insufficient documentation' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('REJECTED');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 5: Wallet Flow
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 5: Wallet Operations', () => {
    beforeEach(() => setupUserAuth());

    it('Step 1: checks wallet balance', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        walletBalance: BigInt(1_000_000_00),
        pendingBalance: BigInt(0),
        virtualAccountNo: '1234567890',
        virtualAccountBank: 'Prodigy MFB',
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/wallet/me')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('walletBalance');
      expect(res.body).toHaveProperty('virtualAccountNo');
    });

    it('Step 2: views transaction history', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([MOCK.walletTx, { ...MOCK.walletTx, id: 'tx-002', type: 'SUBSCRIPTION' }] as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/wallet/me/transactions')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('Step 3: requests withdrawal — success', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { update: jest.fn().mockResolvedValue(MOCK.client) },
        walletTransaction: { create: jest.fn().mockResolvedValue({ ...MOCK.walletTx, type: 'WALLET_WITHDRAWAL', status: 'PENDING', bankName: 'GTBank' }) },
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ amountKobo: 50000, bankName: 'GTBank', bankAcctNo: '0123456789', bankAcctName: 'John Doe' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.bankName).toBe('GTBank');
    });

    it('Step 4: withdrawal fails with insufficient balance', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, walletBalance: BigInt(100), // ₦0.01
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet/withdraw')
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ amountKobo: 99999999999, bankName: 'GTBank', bankAcctNo: '0123456789', bankAcctName: 'John Doe' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 6: Goals Lifecycle
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 6: Goals Lifecycle', () => {
    beforeEach(() => setupUserAuth());

    it('Step 1: creates a savings goal', async () => {
      prisma.goal.create.mockResolvedValueOnce(MOCK.goal as any);
      const res = await request(app.getHttpServer())
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ name: 'School Fees', targetAmountKobo: '50000000' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('School Fees');
    });

    it('Step 2: views all goals', async () => {
      prisma.goal.findMany.mockResolvedValueOnce([MOCK.goal] as any);
      const res = await request(app.getHttpServer())
        .get('/api/v1/goals/me')
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('Step 3: updates goal name', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(MOCK.goal as any);
      prisma.goal.update.mockResolvedValueOnce({ ...MOCK.goal, name: 'University Fees' } as any);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/goals/${IDS.GOAL}`)
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ name: 'University Fees' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('University Fees');
    });

    it('Step 4: cannot update another client\'s goal', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce({ ...MOCK.goal, clientId: 'other-client-id' } as any);
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/goals/${IDS.GOAL}`)
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ name: 'Hack' });

      expect(res.status).toBe(403);
    });

    it('Step 5: deletes a goal', async () => {
      prisma.goal.findUnique.mockResolvedValueOnce(MOCK.goal as any);
      prisma.goal.delete.mockResolvedValueOnce(MOCK.goal as any);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/goals/${IDS.GOAL}`)
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 7: Investment Statement
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 7: Investment Statement', () => {
    beforeEach(() => setupUserAuth());

    it('retrieves investment statement with history', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce({
        ...MOCK.investment, product: MOCK.product, client: MOCK.client,
        history: [
          { id: 'h1', action: 'Subscription Submitted', createdAt: new Date() },
          { id: 'h2', action: 'Approved & Activated', createdAt: new Date() },
        ],
      } as any);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/investments/${IDS.INVESTMENT}/statement`)
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.history).toHaveLength(2);
      expect(res.body.investRef).toBe('INV-0001');
    });

    it('404 — cannot access another client\'s statement', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce(null); // not found for this clientDbId
      const res = await request(app.getHttpServer())
        .get(`/api/v1/investments/other-inv-id/statement`)
        .set('Authorization', `Bearer ${makeAccessToken()}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 8: Pre-Termination (Early Redemption)
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 8: Early Redemption Request', () => {
    beforeEach(() => setupUserAuth());

    it('creates pre-termination request for active investment', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce(MOCK.investment as any);
      prisma.preTermination.create.mockResolvedValueOnce({
        id: IDS.PRE_TERM, preTermRef: 'PT-001', status: 'PENDING_OPS',
        investmentId: IDS.INVESTMENT, requestedAmountKobo: MOCK.investment.principalKobo,
      } as any);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/investments/${IDS.INVESTMENT}/redeem`)
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ reason: 'Emergency funds needed' });

      expect(res.status).toBe(201);
      expect(res.body.preTermRef).toBe('PT-001');
    });

    it('404 — cannot redeem investment that is not ACTIVE', async () => {
      prisma.investment.findFirst.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/investments/bad-inv-id/redeem`)
        .set('Authorization', `Bearer ${makeAccessToken()}`)
        .send({ reason: 'testing' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTS — Public Access
  // ═══════════════════════════════════════════════════════════════
  describe('Products — Public Endpoint', () => {
    it('GET /products returns active products without authentication', async () => {
      prisma.product.findMany.mockResolvedValueOnce([MOCK.product] as any);
      const res = await request(app.getHttpServer()).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body[0].status).toBe('ACTIVE');
      expect(res.body[0]).toHaveProperty('roiMin');
    });

    it('GET /products/:id returns single product', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      const res = await request(app.getHttpServer()).get(`/api/v1/products/${IDS.PRODUCT}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(IDS.PRODUCT);
    });

    it('GET /products/:id returns 404 for unknown product', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer()).get('/api/v1/products/bad-id');
      expect(res.status).toBe(404);
    });

    it('PATCH /admin/products/:id — admin updates product ROI', async () => {
      setupAdminAuth();
      prisma.product.findUnique.mockResolvedValueOnce(MOCK.product as any);
      prisma.product.update.mockResolvedValueOnce({ ...MOCK.product, roiMin: 17.0 } as any);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/products/${IDS.PRODUCT}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ roiMin: 17.0 });

      expect(res.status).toBe(200);
      expect(res.body.roiMin).toBe(17.0);
    });
  });
});
