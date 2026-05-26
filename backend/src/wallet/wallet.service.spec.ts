import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: PrismaService, useValue: prisma }],
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

  // ── creditWallet ─────────────────────────────────────────────────
  describe('creditWallet()', () => {
    it('increments balance and creates transaction record', async () => {
      const updatedClient = { ...MOCK.client, walletBalance: BigInt(600_000_00) };
      const createdTx = { ...MOCK.walletTx, paystackRef: 'PAY-REF-001' };
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { update: jest.fn().mockResolvedValue(updatedClient) },
          walletTransaction: { create: jest.fn().mockResolvedValue(createdTx) },
        };
        return fn(txMock);
      });

      const result = await service.creditWallet(IDS.CLIENT_DB, BigInt(100_000_00), 'PAY-REF-001');
      expect(result.paystackRef).toBe('PAY-REF-001');
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
        ...MOCK.client, walletBalance: BigInt(1000), // tiny balance
      } as any);
      const bigWithdraw = { ...withdrawDto, amountKobo: BigInt(999_999_999) };
      await expect(service.requestWithdrawal(IDS.CLIENT_DB, bigWithdraw)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when client does not exist', async () => {
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.requestWithdrawal('bad-id', withdrawDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── adminGetAll ───────────────────────────────────────────────────
  describe('adminGetAll()', () => {
    it('returns all transactions when no query filters', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([MOCK.walletTx] as any);
      const result = await service.adminGetAll({});
      expect(result).toHaveLength(1);
    });

    it('applies type and status filters together', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      await service.adminGetAll({ type: 'WALLET_FUNDING', status: 'SUCCESSFUL' });
      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'WALLET_FUNDING', status: 'SUCCESSFUL' }),
        }),
      );
    });

    it('applies search filter across txnRef and client name', async () => {
      prisma.walletTransaction.findMany.mockResolvedValueOnce([]);
      await service.adminGetAll({ search: 'WAL-' });
      const callArg = prisma.walletTransaction.findMany.mock.calls[0][0] as any;
      expect(callArg.where.OR).toBeDefined();
    });
  });
});
