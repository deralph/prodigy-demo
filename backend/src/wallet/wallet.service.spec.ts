import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let configGet: jest.Mock;

  beforeEach(async () => {
    prisma = createMockPrisma();
    configGet = jest.fn().mockReturnValue(undefined); // default: no PAYSTACK_SECRET_KEY

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: configGet } },
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
    it('returns all transactions for the client', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([MOCK.walletTx] as any);
      const result = await service.getTransactions(IDS.CLIENT_DB);
      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe(IDS.CLIENT_DB);
    });

    it('filters by type when query.type supplied', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      await service.getTransactions(IDS.CLIENT_DB, { type: 'WALLET_FUNDING' });
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'WALLET_FUNDING' }) }),
      );
    });

    it('filters by status when query.status supplied', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      await service.getTransactions(IDS.CLIENT_DB, { status: 'SUCCESSFUL' });
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'SUCCESSFUL' }) }),
      );
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
    it('throws NotFoundException when no transaction for reference', async () => {
      prisma.walletTransaction.findFirst.mockResolvedValueOnce(null);
      await expect(service.verifyPayment(IDS.CLIENT_DB, 'UNKNOWN-REF')).rejects.toThrow(NotFoundException);
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

    it('creates PENDING withdrawal and decrements wallet balance', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      const createdTx = { ...MOCK.walletTx, type: 'WALLET_WITHDRAWAL', status: 'PENDING' };
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { update: jest.fn().mockResolvedValue(MOCK.client) },
          walletTransaction: { create: jest.fn().mockResolvedValue(createdTx) },
        };
        return fn(txMock);
      });

      const result = await service.requestWithdrawal(IDS.CLIENT_DB, withdrawDto);
      expect(result.status).toBe('PENDING');
      expect(result.type).toBe('WALLET_WITHDRAWAL');
    });

    it('throws BadRequestException when withdrawal exceeds balance', async () => {
      prisma.client.findUnique.mockResolvedValueOnce({
        ...MOCK.client, walletBalance: BigInt(1000),
      } as any);
      const bigWithdraw = { ...withdrawDto, amountKobo: BigInt(999_999_999) };
      await expect(service.requestWithdrawal(IDS.CLIENT_DB, bigWithdraw)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when client not found', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.requestWithdrawal('bad-id', withdrawDto)).rejects.toThrow(NotFoundException);
    });
  });
});
