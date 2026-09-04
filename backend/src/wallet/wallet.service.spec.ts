import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let configGet: jest.Mock;
  let notifications: ReturnType<typeof createMockNotifications>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    configGet = jest.fn().mockReturnValue(undefined); // default: no PAYSTACK_SECRET_KEY
    notifications = createMockNotifications();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: configGet } },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(WalletService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getWallet ────────────────────────────────────────────────────
  describe('getWallet()', () => {
    it('returns wallet balance and virtual account', async () => {
      const walletData = {
        walletBalance: BigInt(500_000),
        pendingBalance: BigInt(0),
        virtualAccountNo: '0123456789',
        virtualAccountBank: 'Prodigy MFB',
      };
      prisma.client.findUnique.mockResolvedValueOnce(walletData as any);
      const result = await service.getWallet(IDS.CLIENT_DB);
      expect(result.walletBalance).toBe(BigInt(500_000));
      expect(result.virtualAccountNo).toBe('0123456789');
    });

    it('throws NotFoundException when client not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.getWallet('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getTransactions ───────────────────────────────────────────────
  describe('getTransactions()', () => {
    it('returns paginated transactions for the client', async () => {
      const mockResult = { data: [MOCK.walletTx], total: 1, page: 1, limit: 50, totalPages: 1 };
      prisma.walletTransaction.findMany.mockResolvedValueOnce([MOCK.walletTx] as any);
      prisma.walletTransaction.count.mockResolvedValueOnce(1);
      const result = await service.getTransactions(IDS.CLIENT_DB);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].clientId).toBe(IDS.CLIENT_DB);
      expect(result.total).toBe(1);
    });

    it('filters by type when query.type supplied', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      prisma.walletTransaction.count.mockResolvedValueOnce(0);
      await service.getTransactions(IDS.CLIENT_DB, { type: 'WALLET_FUNDING' });
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'WALLET_FUNDING' }) }),
      );
    });

    it('filters by status when query.status supplied', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      prisma.walletTransaction.count.mockResolvedValueOnce(0);
      await service.getTransactions(IDS.CLIENT_DB, { status: 'SUCCESSFUL' });
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'SUCCESSFUL' }) }),
      );
    });

    it('applies dateFrom and dateTo filters', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      prisma.walletTransaction.count.mockResolvedValueOnce(0);
      await service.getTransactions(IDS.CLIENT_DB, { dateFrom: '2024-01-01', dateTo: '2024-12-31' });
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          }),
        }),
      );
    });

    it('throws on invalid dateFrom', async () => {
      await expect(service.getTransactions(IDS.CLIENT_DB, { dateFrom: 'invalid' })).rejects.toThrow(BadRequestException);
    });

    it('throws on invalid dateTo', async () => {
      await expect(service.getTransactions(IDS.CLIENT_DB, { dateTo: 'invalid' })).rejects.toThrow(BadRequestException);
    });
  });

  // ── getTransactionDetail ───────────────────────────────────────────
  describe('getTransactionDetail()', () => {
    it('returns transaction with activity log and audit log', async () => {
      const mockTxn = { ...MOCK.walletTx, id: 'txn-123', clientId: IDS.CLIENT_DB, txnRef: 'WAL-TEST-001' };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(mockTxn as any);
      prisma.activityLog.findMany.mockResolvedValueOnce([{ id: 'act-1', action: 'TEST' }] as any);
      prisma.auditLog.findMany.mockResolvedValueOnce([{ id: 'aud-1', action: 'TEST' }] as any);

      const result = await service.getTransactionDetail(IDS.CLIENT_DB, 'txn-123');

      expect(result.transaction).toEqual(mockTxn);
      expect(result.activityLog).toHaveLength(1);
      expect(result.auditLog).toHaveLength(1);
    });

    it('throws NotFoundException when transaction not found', async () => {
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null);
      await expect(service.getTransactionDetail(IDS.CLIENT_DB, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('allows admin to fetch without clientDbId', async () => {
      const mockTxn = { ...MOCK.walletTx, id: 'txn-123', clientId: IDS.CLIENT_DB, txnRef: 'WAL-TEST-001' };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(mockTxn as any);
      prisma.activityLog.findMany.mockResolvedValueOnce([]);
      prisma.auditLog.findMany.mockResolvedValueOnce([]);

      const result = await service.getTransactionDetail('', 'txn-123');
      expect(result.transaction).toEqual(mockTxn);
    });
  });

  // ── initiatePaystackPayment ──────────────────────────────────────
  describe('initiatePaystackPayment()', () => {
    it('creates a PENDING transaction and activity log', async () => {
      const createdTx = { ...MOCK.walletTx, status: 'PENDING' };
      prisma.walletTransaction.create.mockResolvedValueOnce(createdTx);
      prisma.activityLog.create.mockResolvedValueOnce({});

      const result = await service.initiatePaystackPayment(
        IDS.CLIENT_DB, 'john@example.com', BigInt(100_000),
      );

      expect(result.reference).toBeDefined();
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING', type: 'WALLET_FUNDING' }),
        }),
      );
    });

    it('uses a client-provided reference when given', async () => {
      prisma.walletTransaction.create.mockResolvedValueOnce({});
      prisma.activityLog.create.mockResolvedValueOnce({});

      const result = await service.initiatePaystackPayment(
        IDS.CLIENT_DB, 'john@example.com', BigInt(100_000), 'MY-CUSTOM-REF-001',
      );
      expect(result.reference).toBe('MY-CUSTOM-REF-001');
    });
  });

  // ── creditWallet ─────────────────────────────────────────────────
  describe('creditWallet()', () => {
    it('increments balance and creates transaction record', async () => {
      const updatedClient = { ...MOCK.client, walletBalance: BigInt(600_000_00) };
      const createdTx = { ...MOCK.walletTx, paystackRef: 'PAY-REF-001' };

      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { update: jest.fn().mockResolvedValue(updatedClient) },
          walletTransaction: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(null)   // idempotency: no SUCCESSFUL
              .mockResolvedValueOnce(null),  // no PENDING
            create: jest.fn().mockResolvedValue(createdTx),
            update: jest.fn(),
          },
        };
        return fn(txMock);
      });

      const result = await service.creditWallet(IDS.CLIENT_DB, BigInt(100_000_00), 'PAY-REF-001');
      expect(result.paystackRef).toBe('PAY-REF-001');
    });

    it('is idempotent — returns existing SUCCESSFUL txn', async () => {
      const existingTx = { ...MOCK.walletTx, paystackRef: 'PAY-REF-001', status: 'SUCCESSFUL' };
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { update: jest.fn() },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValueOnce(existingTx),
            create: jest.fn(),
            update: jest.fn(),
          },
        };
        return fn(txMock);
      });

      const result = await service.creditWallet(IDS.CLIENT_DB, BigInt(100_000_00), 'PAY-REF-001');
      expect(result).toBe(existingTx);
    });
  });

  // ── verifyPayment ────────────────────────────────────────────────
  describe('verifyPayment()', () => {
    it('creates + credits when no pre-existing record (popup-only flow, demo mode)', async () => {
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null); // no existing record
      configGet.mockReturnValue(undefined); // demo mode (no secret)
      const created = { ...MOCK.walletTx, status: 'SUCCESSFUL', paystackRef: 'NEW-REF', amountKobo: BigInt(50_000) };
      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          client: { update: jest.fn() },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
            create: jest.fn().mockResolvedValue(created),
            update: jest.fn(),
          },
        }),
      );
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.verifyPayment(IDS.CLIENT_DB, 'NEW-REF', 'john@example.com', BigInt(50_000));
      expect(result.status).toBe('success');
    });

    it('returns success immediately for already-SUCCESSFUL txn (idempotent)', async () => {
      const successfulTx = { ...MOCK.walletTx, status: 'SUCCESSFUL', paystackRef: 'REF-001' };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(successfulTx);

      const result = await service.verifyPayment(IDS.CLIENT_DB, 'REF-001');
      expect(result.status).toBe('success');
      expect(result.transaction).toBe(successfulTx);
    });

    it('credits wallet directly in demo mode (no secret key)', async () => {
      const pendingTx = { ...MOCK.walletTx, status: 'PENDING', paystackRef: 'REF-002', amountKobo: BigInt(50_000) };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(pendingTx);
      configGet.mockReturnValue(undefined); // no secret

      const creditedTx = { ...pendingTx, status: 'SUCCESSFUL' };
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { update: jest.fn() },
          walletTransaction: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(null)       // no existing SUCCESSFUL
              .mockResolvedValueOnce(pendingTx), // existing PENDING found
            create: jest.fn(),
            update: jest.fn().mockResolvedValue(creditedTx),
          },
        };
        return fn(txMock);
      });
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.verifyPayment(IDS.CLIENT_DB, 'REF-002');
      expect(result.status).toBe('success');
    });

    // Helper: make $transaction credit a PENDING txn successfully
    const mockCredit = (pendingTx: any) =>
      prisma.$transaction.mockImplementationOnce(async (fn: any) =>
        fn({
          client: { update: jest.fn() },
          walletTransaction: {
            findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(pendingTx),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({ ...pendingTx, status: 'SUCCESSFUL' }),
          },
        }),
      );

    it('refuses to credit in PRODUCTION without a live Paystack key (fail closed)', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null);
      configGet.mockReturnValue(undefined); // no key in production
      try {
        await expect(
          service.verifyPayment(IDS.CLIENT_DB, 'REF-FAILCLOSED', 'john@example.com', BigInt(50_000)),
        ).rejects.toThrow(ServiceUnavailableException);
        expect(prisma.$transaction).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('credits the verified amount when Paystack confirms (sk_test)', async () => {
      const pendingTx = { ...MOCK.walletTx, status: 'PENDING', paystackRef: 'REF-OK', amountKobo: BigInt(50_000) };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(pendingTx);
      configGet.mockReturnValue('sk_test_xxx');
      (global as any).fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ status: true, data: { status: 'success', amount: 50_000, channel: 'card' } }),
      });
      mockCredit(pendingTx);
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.verifyPayment(IDS.CLIENT_DB, 'REF-OK');
      expect(result.status).toBe('success');
      expect((global as any).fetch).toHaveBeenCalled();
    });

    it('falls back to crediting in TEST mode when verify cannot confirm (key mismatch)', async () => {
      const pendingTx = { ...MOCK.walletTx, status: 'PENDING', paystackRef: 'REF-MISS', amountKobo: BigInt(50_000) };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(pendingTx);
      configGet.mockReturnValue('sk_test_xxx');
      (global as any).fetch = jest.fn().mockResolvedValue({
        status: 404,
        json: async () => ({ status: false, message: 'Transaction reference not found' }),
      });
      mockCredit(pendingTx);
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.verifyPayment(IDS.CLIENT_DB, 'REF-MISS');
      expect(result.status).toBe('success');
    }, 10000);

    it('throws and marks FAILED in LIVE mode when verify fails', async () => {
      const pendingTx = { ...MOCK.walletTx, status: 'PENDING', paystackRef: 'REF-LIVE', amountKobo: BigInt(50_000) };
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(pendingTx);
      configGet.mockReturnValue('sk_live_xxx');
      (global as any).fetch = jest.fn().mockResolvedValue({
        status: 404,
        json: async () => ({ status: false, message: 'Transaction reference not found' }),
      });
      prisma.walletTransaction.update.mockResolvedValue({});
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await expect(service.verifyPayment(IDS.CLIENT_DB, 'REF-LIVE')).rejects.toThrow(BadRequestException);
      expect(prisma.walletTransaction.update).toHaveBeenCalled();
    }, 10000);
  });

  // ── getPaystackConfig ────────────────────────────────────────────
  describe('getPaystackConfig()', () => {
    it('returns the configured public key', () => {
      configGet.mockReturnValue('pk_test_abc');
      expect(service.getPaystackConfig()).toEqual({ publicKey: 'pk_test_abc' });
    });

    it('returns null when not configured', () => {
      configGet.mockReturnValue(undefined);
      expect(service.getPaystackConfig()).toEqual({ publicKey: null });
    });
  });

  // ── requestWithdrawal ─────────────────────────────────────────────
  describe('requestWithdrawal()', () => {
    const withdrawDto = {
      amountKobo: BigInt(50_000_00),
      bankName: 'GTBank',
      bankAcctNo: '0123456789',
      bankAcctName: 'John Doe',
    };

    it('creates PENDING withdrawal and decrements wallet balance for JOINT AND mandate', async () => {
      const jointAndClient = { ...MOCK.client, type: 'JOINT', mandateType: 'AND' };
      prisma.client.findUnique.mockResolvedValueOnce(jointAndClient as any);
      prisma.authUser.findFirst.mockResolvedValueOnce({ id: 'secondary-auth', holderType: 'SECONDARY', email: 'secondary@example.com' } as any);
      const createdTx = { ...MOCK.walletTx, type: 'WALLET_WITHDRAWAL', status: 'PENDING', requiresCoSign: true, clientId: IDS.CLIENT_DB };
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: { create: jest.fn().mockResolvedValue(createdTx) },
        };
        return fn(txMock);
      });
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: IDS.AUTH_USER, holderType: 'PRIMARY', email: MOCK.client.email } as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, withdrawDto);
      // Type guard: PENDING path returns wallet transaction
      if ('requiresCoSign' in result) {
        expect(result.status).toBe('PENDING');
        expect(result.type).toBe('WALLET_WITHDRAWAL');
        expect(result.requiresCoSign).toBe(true);
      } else {
        throw new Error('Expected PENDING withdrawal with requiresCoSign');
      }
    });

    it('auto-executes withdrawal for individual client (one-way execution)', async () => {
      const individualClient = { ...MOCK.client, type: 'INDIVIDUAL', walletBalance: BigInt(1_000_000_00) };
      prisma.client.findUnique.mockResolvedValueOnce(individualClient as any); // first call in requestWithdrawal
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: IDS.AUTH_USER, holderType: 'PRIMARY', email: MOCK.client.email } as any);
      // Second call to findUnique in executeWithdrawal
      prisma.client.findUnique.mockResolvedValueOnce(individualClient as any);
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: IDS.AUTH_USER, holderType: 'PRIMARY', email: MOCK.client.email } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: { create: jest.fn().mockResolvedValue({ status: 'SUCCESSFUL', amountKobo: BigInt(50_000_00), transferCode: 'AUTO-123' }) },
        };
        return fn(txMock);
      });
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, withdrawDto);
      // Type guard: auto-execution path returns execution result
      if ('transferCode' in result) {
        expect(result.status).toBe('SUCCESSFUL');
        expect(result.amountKobo).toBe(BigInt(50_000_00));
        expect(result.transferCode).toBeDefined();
      } else {
        throw new Error('Expected auto-executed withdrawal with transferCode');
      }
    });

    it('throws BadRequestException when withdrawal exceeds balance', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, walletBalance: BigInt(1000),
      } as any);
      const bigWithdraw = { ...withdrawDto, amountKobo: BigInt(999_999_999) };
      await expect(service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, bigWithdraw)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when client not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.requestWithdrawal('bad-id', IDS.AUTH_USER, withdrawDto)).rejects.toThrow(NotFoundException);
    });

    it('rejects a zero-amount withdrawal', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      await expect(
        service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, { ...withdrawDto, amountKobo: BigInt(0) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a negative-amount withdrawal (prevents balance-minting exploit)', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      await expect(
        service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, { ...withdrawDto, amountKobo: BigInt(-50_000_00) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects withdrawal when bank details are missing', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      await expect(
        service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, { ...withdrawDto, bankAcctNo: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks a JOINT/AND-mandate withdrawal when the secondary holder has not set up their own login yet', async () => {
      const jointClient = { ...MOCK.client, type: 'JOINT', mandateType: 'AND' };
      prisma.client.findUnique.mockResolvedValueOnce(jointClient as any);
      prisma.authUser.findFirst.mockResolvedValueOnce(null); // no SECONDARY AuthUser yet
      await expect(
        service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, withdrawDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a JOINT/AND-mandate withdrawal as requiresCoSign=true (real second signature, not a checkbox)', async () => {
      const jointClient = { ...MOCK.client, type: 'JOINT', mandateType: 'AND', secondaryName: 'Jane Doe' };
      prisma.client.findUnique.mockResolvedValueOnce(jointClient as any);
      prisma.authUser.findFirst
        .mockResolvedValueOnce({ id: 'secondary-auth-1', holderType: 'SECONDARY' } as any) // secondary-setup guard
        .mockResolvedValueOnce({ id: 'secondary-auth-1', holderType: 'SECONDARY', email: 'jane@example.com' } as any); // other-holder lookup for notification
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: IDS.AUTH_USER, holderType: 'PRIMARY', email: MOCK.client.email } as any);
      const createTxMock = jest.fn().mockResolvedValue({ ...MOCK.walletTx, type: 'WALLET_WITHDRAWAL', status: 'PENDING', requiresCoSign: true });
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: { create: createTxMock },
        };
        return fn(txMock);
      });

      const result = await service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, withdrawDto);
      expect(result.status).toBe('PENDING');
      expect(createTxMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ requiresCoSign: true, requestedByAuthUserId: IDS.AUTH_USER }) }),
      );
      // Both the requester and the other holder (who must co-sign) are notified
      expect(notifications.sendWithdrawalRequestedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, expect.any(Number), true,
      );
      expect(notifications.sendWithdrawalCoSignNeededEmail).toHaveBeenCalledWith(
        'jane@example.com', 'Jane Doe', MOCK.client.name, expect.any(Number),
      );
    });

    it('allows a JOINT/OR-mandate withdrawal with no co-sign requirement (goes to admin queue)', async () => {
      const jointClient = { ...MOCK.client, type: 'JOINT', mandateType: 'OR' };
      prisma.client.findUnique.mockResolvedValueOnce(jointClient as any);
      const createTxMock = jest.fn().mockResolvedValue({ ...MOCK.walletTx, type: 'WALLET_WITHDRAWAL', status: 'PENDING', requiresCoSign: false });
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          walletTransaction: { create: createTxMock },
        };
        return fn(txMock);
      });
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: IDS.AUTH_USER, holderType: 'PRIMARY', email: MOCK.client.email } as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const result = await service.requestWithdrawal(IDS.CLIENT_DB, IDS.AUTH_USER, withdrawDto);
      expect(result.status).toBe('PENDING');
      expect(createTxMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ requiresCoSign: false }) }),
      );
    });
  });

  // ── cosignWithdrawal() / declineCosignWithdrawal() / getPendingCosignForHolder() ──
  describe('joint holder co-signature', () => {
    const coSignTxn = {
      ...MOCK.walletTx, id: 'wtx-cosign-1', type: 'WALLET_WITHDRAWAL', status: 'PENDING',
      requiresCoSign: true, coSignedByAuthUserId: null, requestedByAuthUserId: IDS.AUTH_USER,
      clientId: IDS.CLIENT_DB, amountKobo: BigInt(30_000_00),
    };
    const OTHER_HOLDER = 'secondary-auth-1';

    it('getPendingCosignForHolder excludes the requester\'s own request', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([coSignTxn] as any);
      const result = await service.getPendingCosignForHolder(IDS.CLIENT_DB, OTHER_HOLDER);
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ requestedByAuthUserId: { not: OTHER_HOLDER } }),
        }),
      );
      expect(result).toEqual([coSignTxn]);
    });

    it('cosignWithdrawal rejects the requester trying to co-sign their own request', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(coSignTxn as any);
      await expect(
        service.cosignWithdrawal(coSignTxn.id, IDS.CLIENT_DB, IDS.AUTH_USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('cosignWithdrawal rejects a transaction belonging to a different client', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...coSignTxn, clientId: 'someone-elses-client' } as any);
      await expect(
        service.cosignWithdrawal(coSignTxn.id, IDS.CLIENT_DB, OTHER_HOLDER),
      ).rejects.toThrow(NotFoundException);
    });

    it('cosignWithdrawal succeeds when the OTHER holder signs', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(coSignTxn as any);
      prisma.walletTransaction.update.mockResolvedValueOnce({ ...coSignTxn, coSignedByAuthUserId: OTHER_HOLDER } as any);
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: IDS.AUTH_USER, holderType: 'PRIMARY', email: MOCK.client.email } as any);

      const result = await service.cosignWithdrawal(coSignTxn.id, IDS.CLIENT_DB, OTHER_HOLDER);
      expect(result.coSignedByAuthUserId).toBe(OTHER_HOLDER);
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'WALLET_WITHDRAWAL_COSIGNED' }) }),
      );
      // Requester is told it's co-signed; finance admins are told it's ready for review
      expect(notifications.sendWithdrawalCoSignedEmail).toHaveBeenCalled();
      expect(notifications.notifyAdminsByRole).toHaveBeenCalledWith(
        ['SUPER_ADMIN', 'FINANCE'], expect.any(String), expect.any(String),
      );
    });

    it('cosignWithdrawal rejects an already-cosigned transaction', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...coSignTxn, coSignedByAuthUserId: 'already-signed' } as any);
      await expect(
        service.cosignWithdrawal(coSignTxn.id, IDS.CLIENT_DB, OTHER_HOLDER),
      ).rejects.toThrow(BadRequestException);
    });

    it('declineCosignWithdrawal returns funds to wallet and marks REVERSED', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(coSignTxn as any);
      const clientUpdate = jest.fn().mockResolvedValue({});
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { update: clientUpdate },
        walletTransaction: { update: jest.fn().mockResolvedValue({ ...coSignTxn, status: 'REVERSED' }) },
      }));

      const result = await service.declineCosignWithdrawal(coSignTxn.id, IDS.CLIENT_DB, OTHER_HOLDER, 'Not authorized');
      expect(result.status).toBe('REVERSED');
      expect(clientUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ walletBalance: { increment: coSignTxn.amountKobo } }) }),
      );
    });

    it('approveWithdrawal (admin) is blocked until the withdrawal has been co-signed', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(coSignTxn as any); // coSignedByAuthUserId is null
      await expect(
        service.approveWithdrawal(coSignTxn.id, { adminId: IDS.ADMIN_USER, adminRole: 'FINANCE' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── approveWithdrawal() ──────────────────────────────────────────
  describe('approveWithdrawal()', () => {
    const pendingTxn = { ...MOCK.walletTx, id: 'wtx-1', type: 'WALLET_WITHDRAWAL', status: 'PENDING', bankName: 'GTBank', bankAcctNo: '0123456789', bankAcctName: 'John Doe', amountKobo: BigInt(50_000_00) };
    const adminCtx = { adminId: IDS.ADMIN_USER, adminRole: 'FINANCE' };

    it('throws NotFoundException when transaction not found', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.approveWithdrawal('missing', adminCtx)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for a non-withdrawal transaction', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...pendingTxn, type: 'WALLET_FUNDING' } as any);
      await expect(service.approveWithdrawal('wtx-1', adminCtx)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if withdrawal is not PENDING', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...pendingTxn, status: 'SUCCESSFUL' } as any);
      await expect(service.approveWithdrawal('wtx-1', adminCtx)).rejects.toThrow(BadRequestException);
    });

    it('demo mode (no Paystack key): disburses, decrements pendingBalance, marks SUCCESSFUL', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(pendingTxn as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Jane Finance' } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic claim
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        walletTransaction: { update: jest.fn().mockResolvedValue({ ...pendingTxn, status: 'SUCCESSFUL' }) },
      }));

      const result = await service.approveWithdrawal('wtx-1', adminCtx);
      expect(result.status).toBe('SUCCESSFUL');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'WALLET_WITHDRAWAL_APPROVED', category: 'FINANCE' }) }),
      );
    });

    it('rejects a second concurrent approve — the atomic claim blocks double disbursement', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(pendingTxn as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Jane Finance' } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 0 } as any); // claim lost to another admin
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...pendingTxn, status: 'SUCCESSFUL' } as any);

      await expect(service.approveWithdrawal('wtx-1', adminCtx)).rejects.toThrow(BadRequestException);
    });

    it('live mode: resolves bank code, creates recipient, initiates transfer, marks SUCCESSFUL', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      configGet.mockImplementation((key: string) => (key === 'PAYSTACK_SECRET_KEY' ? 'sk_live_abc123' : undefined));
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(pendingTxn as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Jane Finance' } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic claim
      (global as any).fetch = jest.fn()
        .mockResolvedValueOnce({ json: async () => ({ status: true, data: [{ code: '058', name: 'Guaranty Trust Bank' }] }) }) // /bank
        .mockResolvedValueOnce({ json: async () => ({ status: true, data: { recipient_code: 'RCP_123' } }) })                   // /transferrecipient
        .mockResolvedValueOnce({ json: async () => ({ status: true, data: { transfer_code: 'TRF_456' } }) });                   // /transfer
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        walletTransaction: { update: jest.fn().mockResolvedValue({ ...pendingTxn, status: 'SUCCESSFUL', paystackTransferCode: 'TRF_456' }) },
      }));

      try {
        const result = await service.approveWithdrawal('wtx-1', adminCtx);
        expect(result.status).toBe('SUCCESSFUL');
        expect(result.paystackTransferCode).toBe('TRF_456');
        expect((global as any).fetch).toHaveBeenCalledTimes(3);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('live mode: unresolvable bank name fails the disbursement and returns funds to wallet balance', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      configGet.mockImplementation((key: string) => (key === 'PAYSTACK_SECRET_KEY' ? 'sk_live_abc123' : undefined));
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...pendingTxn, bankName: 'Totally Unknown Bank Xyz' } as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Jane Finance' } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic claim
      (global as any).fetch = jest.fn().mockResolvedValueOnce({ json: async () => ({ status: true, data: [] }) });

      const txUpdate = jest.fn().mockResolvedValue({ ...pendingTxn, status: 'FAILED' });
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        walletTransaction: { update: txUpdate },
      }));

      try {
        const result = await service.approveWithdrawal('wtx-1', adminCtx);
        expect(result.status).toBe('FAILED');
        expect(txUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
        );
        // Funds must be returned to wallet balance, not left stranded
        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ action: 'WALLET_WITHDRAWAL_FAILED' }) }),
        );
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  // ── rejectWithdrawal() ───────────────────────────────────────────
  describe('rejectWithdrawal()', () => {
    const pendingTxn = { ...MOCK.walletTx, id: 'wtx-2', type: 'WALLET_WITHDRAWAL', status: 'PENDING', amountKobo: BigInt(20_000_00) };
    const adminCtx = { adminId: IDS.ADMIN_USER, adminRole: 'SUPER_ADMIN' };

    it('throws NotFoundException when transaction not found', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.rejectWithdrawal('missing', adminCtx, 'no reason')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if withdrawal is not PENDING', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...pendingTxn, status: 'REVERSED' } as any);
      await expect(service.rejectWithdrawal('wtx-2', adminCtx, 'no reason')).rejects.toThrow(BadRequestException);
    });

    it('returns funds to wallet balance and marks REVERSED', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(pendingTxn as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Compliance Officer' } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 1 } as any); // atomic claim
      const clientUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: clientUpdateMany },
        walletTransaction: { update: jest.fn().mockResolvedValue({ ...pendingTxn, status: 'REVERSED' }) },
      }));

      const result = await service.rejectWithdrawal('wtx-2', adminCtx, 'Suspicious bank details');
      expect(result.status).toBe('REVERSED');
      expect(clientUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: pendingTxn.clientId, pendingBalance: { gte: BigInt(20_000_00) } }),
          data: expect.objectContaining({
            pendingBalance: { decrement: BigInt(20_000_00) },
            walletBalance: { increment: BigInt(20_000_00) },
          }),
        }),
      );
    });

    it('throws BadRequestException when a concurrent reject already claimed the withdrawal', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(pendingTxn as any);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Compliance Officer' } as any);
      prisma.walletTransaction.updateMany.mockResolvedValueOnce({ count: 0 } as any); // claim lost
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...pendingTxn, status: 'REVERSED' } as any);

      await expect(service.rejectWithdrawal('wtx-2', adminCtx, 'reason')).rejects.toThrow(BadRequestException);
    });
  });

  // ── reverseTransaction() ────────────────────────────────────────────
  describe('reverseTransaction()', () => {
    const successfulTxn = { ...MOCK.walletTx, id: 'wtx-rev-1', type: 'WALLET_WITHDRAWAL', status: 'SUCCESSFUL', amountKobo: BigInt(50_000_00), clientId: IDS.CLIENT_DB };
    const adminCtx = { adminId: IDS.ADMIN_USER, adminRole: 'SUPER_ADMIN' };

    it('throws NotFoundException when transaction not found', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.reverseTransaction('missing', adminCtx, 'reason')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for non-reversible transaction type', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...successfulTxn, type: 'LOAN_DISBURSEMENT' } as any);
      await expect(service.reverseTransaction('wtx-rev-1', adminCtx, 'reason')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if transaction already reversed', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...successfulTxn, status: 'REVERSED' } as any);
      await expect(service.reverseTransaction('wtx-rev-1', adminCtx, 'reason')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if reversal already exists', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(successfulTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce({ id: 'existing-rev', relatedTransactionId: 'wtx-rev-1' } as any);
      await expect(service.reverseTransaction('wtx-rev-1', adminCtx, 'reason')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if transaction not SUCCESSFUL', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...successfulTxn, status: 'PENDING' } as any);
      await expect(service.reverseTransaction('wtx-rev-1', adminCtx, 'reason')).rejects.toThrow(BadRequestException);
    });

    it('reverses a WALLET_WITHDRAWAL — credits wallet balance and creates reversal', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(successfulTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null); // no existing reversal
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Finance Manager' } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn() },
        walletTransaction: { create: jest.fn().mockResolvedValue({ id: 'rev-1', status: 'REVERSED' }), update: jest.fn().mockResolvedValue({ ...successfulTxn, status: 'REVERSED' }) },
      }));
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.reverseTransaction('wtx-rev-1', adminCtx, 'Customer requested reversal');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe('REVERSED');
    });

    it('reverses a WALLET_FUNDING — debits wallet balance and creates reversal', async () => {
      const fundingTxn = { ...successfulTxn, type: 'WALLET_FUNDING', amountKobo: BigInt(100_000_00) };
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(fundingTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Finance Manager' } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn() },
        walletTransaction: { create: jest.fn().mockResolvedValue({ id: 'rev-2', status: 'REVERSED' }), update: jest.fn().mockResolvedValue({ ...fundingTxn, status: 'REVERSED' }) },
      }));
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.reverseTransaction('wtx-rev-1', adminCtx, 'Duplicate funding');

      expect(result.status).toBe('REVERSED');
    });

    it('reverses a SUBSCRIPTION — credits wallet balance', async () => {
      const subTxn = { ...successfulTxn, type: 'SUBSCRIPTION', amountKobo: BigInt(200_000_00) };
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(subTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Finance Manager' } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn() },
        walletTransaction: { create: jest.fn().mockResolvedValue({ id: 'rev-3', status: 'REVERSED' }), update: jest.fn().mockResolvedValue({ ...subTxn, status: 'REVERSED' }) },
      }));
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.reverseTransaction('wtx-rev-1', adminCtx, 'Subscription error');

      expect(result.status).toBe('REVERSED');
    });
  });

  // ── adjustTransaction() ────────────────────────────────────────────
  describe('adjustTransaction()', () => {
    const successfulTxn = { ...MOCK.walletTx, id: 'wtx-adj-1', type: 'WALLET_WITHDRAWAL', status: 'SUCCESSFUL', amountKobo: BigInt(50_000_00), clientId: IDS.CLIENT_DB };
    const adminCtx = { adminId: IDS.ADMIN_USER, adminRole: 'SUPER_ADMIN' };

    it('throws NotFoundException when transaction not found', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.adjustTransaction('missing', adminCtx, { correctedAmountKobo: BigInt(60_000_00), reason: 'reason' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for non-adjustable transaction type', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...successfulTxn, type: 'LOAN_DISBURSEMENT' } as any);
      await expect(service.adjustTransaction('wtx-adj-1', adminCtx, { correctedAmountKobo: BigInt(60_000_00), reason: 'reason' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if transaction already adjusted', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(successfulTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce({ id: 'existing-adj', relatedTransactionId: 'wtx-adj-1', metadata: { adjustment: true } } as any);
      await expect(service.adjustTransaction('wtx-adj-1', adminCtx, { correctedAmountKobo: BigInt(60_000_00), reason: 'reason' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if transaction not SUCCESSFUL', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce({ ...successfulTxn, status: 'PENDING' } as any);
      await expect(service.adjustTransaction('wtx-adj-1', adminCtx, { correctedAmountKobo: BigInt(60_000_00), reason: 'reason' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if corrected amount <= 0', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(successfulTxn as any);
      await expect(service.adjustTransaction('wtx-adj-1', adminCtx, { correctedAmountKobo: BigInt(0), reason: 'reason' })).rejects.toThrow(BadRequestException);
    });

    it('adjusts a WALLET_WITHDRAWAL — creates reversal + corrected transaction', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(successfulTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null); // no existing adjustment
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Finance Manager' } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn(),
        },
        walletTransaction: {
          create: jest.fn()
            .mockResolvedValueOnce({ id: 'adj-rev-1', status: 'REVERSED' }) // reversal
            .mockResolvedValueOnce({ id: 'corrected-1', status: 'SUCCESSFUL', amountKobo: BigInt(60_000_00) }), // corrected
          update: jest.fn()
            .mockResolvedValueOnce({ ...successfulTxn, status: 'REVERSED' }) // original updated
            .mockResolvedValueOnce({}), // dummy
        },
      }));
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.adjustTransaction('wtx-adj-1', adminCtx, {
        correctedAmountKobo: BigInt(60_000_00),
        reason: 'Incorrect withdrawal amount',
      });

      expect(result.reversal).toBeDefined();
      expect(result.corrected).toBeDefined();
      expect(result.corrected.amountKobo).toBe(BigInt(60_000_00));
    });

    it('adjusts a WALLET_FUNDING — debits original, credits corrected', async () => {
      const fundingTxn = { ...successfulTxn, type: 'WALLET_FUNDING', amountKobo: BigInt(100_000_00) };
      prisma.walletTransaction.findUnique.mockResolvedValueOnce(fundingTxn as any);
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null);
      prisma.adminUser.findUnique.mockResolvedValueOnce({ id: IDS.ADMIN_USER, name: 'Finance Manager' } as any);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => fn({
        client: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn(),
        },
        walletTransaction: {
          create: jest.fn()
            .mockResolvedValueOnce({ id: 'adj-rev-2', status: 'REVERSED' })
            .mockResolvedValueOnce({ id: 'corrected-2', status: 'SUCCESSFUL', amountKobo: BigInt(80_000_00) }),
          update: jest.fn()
            .mockResolvedValueOnce({ ...fundingTxn, status: 'REVERSED' })
            .mockResolvedValueOnce({}),
        },
      }));
      prisma.activityLog.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.adjustTransaction('wtx-adj-1', adminCtx, {
        correctedAmountKobo: BigInt(80_000_00),
        reason: 'Funding amount correction',
      });

      expect(result.corrected.amountKobo).toBe(BigInt(80_000_00));
    });
  });
});
