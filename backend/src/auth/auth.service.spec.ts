import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { NibssService } from '../nibss/nibss.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { TEST_JWT_SECRET, setTestJwtEnv } from '../../test/helpers/jwt.helper';

// Hash used in all tests — bcrypt of 'Test1234!'
const HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeAll(() => {
    setTestJwtEnv();
    process.env.BVN_HASH_PEPPER = 'test-bvn-pepper';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '1h' } })],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: { sendEmail: jest.fn().mockResolvedValue(undefined), sendOtpEmail: jest.fn().mockResolvedValue(undefined) } },
        NibssService,
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── login ─────────────────────────────────────────────────────────
  describe('login()', () => {
    const dto = { email: 'john@example.com', password: 'Test1234!' };

    it('returns tokens + user on valid credentials', async () => {
      const hash = await bcrypt.hash('Test1234!', 10);
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, passwordHash: hash, client: MOCK.client, adminUser: null,
      });
      prisma.authUser.update.mockResolvedValueOnce({} as any);
      prisma.authUser.update.mockResolvedValueOnce({} as any); // refresh token save

      const result = await service.login(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe('individual');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, passwordHash: await bcrypt.hash('OtherPass!', 10),
        client: MOCK.client, adminUser: null,
      });
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive account', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, isActive: false, client: MOCK.client, adminUser: null,
      });
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── registerCorporate ─────────────────────────────────────────────
  describe('registerCorporate()', () => {
    const dto = { entityName: 'Prodigy Holdings Ltd', email: 'corp@example.com', password: 'Test1234!', phone: '08012345678' };

    it('creates client + authUser + kycRecord and returns clientRef', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(0);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { create: jest.fn().mockResolvedValue({ ...MOCK.corporateClient, clientRef: 'CLI-001' }) },
          authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
          kycRecord: { create: jest.fn().mockResolvedValue({}) },
          $executeRaw: jest.fn().mockResolvedValue(1),
        };
        return fn(txMock);
      });

      const result = await service.registerCorporate(dto);
      expect(result.message).toMatch(/created/i);
      expect(result.clientRef).toBe('CLI-001');
    });

    it('throws ConflictException if email already registered', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(MOCK.authUser as any);
      await expect(service.registerCorporate(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ── registerIndividual ────────────────────────────────────────────
  describe('registerIndividual()', () => {
    const dtoSingle = { accountType: 'single' as const, primaryName: 'John Doe', email: 'john@example.com', password: 'Test1234!', bvn: '22345678901' };
    const dtoJoint  = { accountType: 'joint'  as const, primaryName: 'John Doe', secondaryName: 'Jane Doe', email: 'joint@example.com', password: 'Test1234!', bvn: '22345678901', holderIdentities: [{ name: 'John Doe', bvn: '22345678901', email: 'joint@example.com' }, { name: 'Jane Doe', bvn: '22345678902' }] };

    it('creates individual account and returns clientRef', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(1);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { create: jest.fn().mockResolvedValue({ ...MOCK.client, clientRef: 'CLI-002' }) },
          authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
          kycRecord: { create: jest.fn().mockResolvedValue({}) },
          $executeRaw: jest.fn().mockResolvedValue(1),
        };
        return fn(txMock);
      });

      const result = await service.registerIndividual(dtoSingle);
      expect(result.message).toMatch(/created/i);
      expect(result.clientRef).toBe('CLI-002');
    });

    it('creates joint account with secondaryName', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      prisma.client.count.mockResolvedValueOnce(2);
      prisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const txMock = {
          client: { create: jest.fn().mockResolvedValue({ ...MOCK.client, clientRef: 'CLI-003', type: 'JOINT' }) },
          authUser: { create: jest.fn().mockResolvedValue(MOCK.authUser) },
          kycRecord: { create: jest.fn().mockResolvedValue({}) },
          $executeRaw: jest.fn().mockResolvedValue(1),
        };
        return fn(txMock);
      });

      const result = await service.registerIndividual(dtoJoint);
      expect(result.clientRef).toBe('CLI-003');
    });

    it('throws ConflictException if email already exists', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(MOCK.authUser as any);
      await expect(service.registerIndividual(dtoSingle)).rejects.toThrow(ConflictException);
    });
  });

  // ── forgotPassword ────────────────────────────────────────────────
  describe('forgotPassword()', () => {
    it('returns safe message regardless of whether email exists', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      const res = await service.forgotPassword('nobody@example.com');
      expect(res.message).toMatch(/sent/i);
    });

    it('hashes OTP and stores expiry when user exists', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(MOCK.authUser as any);
      prisma.authUser.update.mockResolvedValueOnce({} as any);
      const res = await service.forgotPassword('john@example.com');
      expect(prisma.authUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ otpExpiry: expect.any(Date) }) }),
      );
      expect(res.message).toBeTruthy();
    });
  });

  // ── logout ────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('clears refreshToken in database', async () => {
      prisma.authUser.update.mockResolvedValueOnce({} as any);
      const res = await service.logout(IDS.AUTH_USER);
      expect(prisma.authUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { refreshToken: null } }),
      );
      expect(res.message).toMatch(/logged out/i);
    });
  });

  // ── getMe ─────────────────────────────────────────────────────────
  describe('getMe()', () => {
    it('returns authUser with client and adminUser', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, client: MOCK.client, adminUser: null,
      } as any);
      const res = await service.getMe(IDS.AUTH_USER);
      expect(res.email).toBe(MOCK.authUser.email);
    });

    it('throws NotFoundException if authUser not found', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.getMe('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
