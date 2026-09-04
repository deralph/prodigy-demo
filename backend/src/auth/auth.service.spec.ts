import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { NibssService } from '../nibss/nibss.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';
import { TEST_JWT_SECRET, setTestJwtEnv, makeMagicToken } from '../../test/helpers/jwt.helper';

// Hash used in all tests — bcrypt of 'Test1234!'
const HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

const createMockOnboarding = () => ({
  onClientRegistered: jest.fn().mockResolvedValue(undefined),
  onKycSubmitted: jest.fn().mockResolvedValue(undefined),
  onKycApproved: jest.fn().mockResolvedValue(undefined),
  onKycRejected: jest.fn().mockResolvedValue(undefined),
  onFirstLoginAfterActivation: jest.fn().mockResolvedValue(undefined),
});

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
        { provide: NotificationsService, useValue: createMockNotifications() },
        { provide: OnboardingService, useValue: createMockOnboarding() },
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
          identityVerification: { create: jest.fn().mockResolvedValue({}) },
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
          identityVerification: { create: jest.fn().mockResolvedValue({}) },
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
          identityVerification: { create: jest.fn().mockResolvedValue({}) },
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

  // ── resendOtp ────────────────────────────────────────────────────
  describe('resendOtp()', () => {
    it('delegates to forgotPassword and issues a fresh OTP', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(MOCK.authUser as any);
      prisma.authUser.update.mockResolvedValueOnce({} as any);
      const res = await service.resendOtp('john@example.com');
      expect(prisma.authUser.update).toHaveBeenCalled();
      expect(res.message).toBeTruthy();
    });
  });

  // ── resetPassword ────────────────────────────────────────────────
  describe('resetPassword()', () => {
    const otpHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // bcrypt hash, value irrelevant for compare mock

    it('rejects a password shorter than 8 characters', async () => {
      await expect(service.resetPassword('john@example.com', '123456', 'Sh0rt')).rejects.toThrow('at least 8 characters');
    });

    it('rejects a password missing required character classes', async () => {
      await expect(service.resetPassword('john@example.com', '123456', 'alllowercase1')).rejects.toThrow(/uppercase/i);
    });

    it('throws if no reset was requested', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({ ...MOCK.authUser, otpCode: null, otpExpiry: null } as any);
      await expect(service.resetPassword('john@example.com', '123456', 'Valid1234')).rejects.toThrow(/no password reset/i);
    });

    it('throws if OTP has expired', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, otpCode: otpHash, otpExpiry: new Date(Date.now() - 60_000),
      } as any);
      await expect(service.resetPassword('john@example.com', '123456', 'Valid1234')).rejects.toThrow(/expired/i);
    });

    it('throws on incorrect OTP', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, otpCode: otpHash, otpExpiry: new Date(Date.now() + 60_000),
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);
      await expect(service.resetPassword('john@example.com', '999999', 'Valid1234')).rejects.toThrow(/incorrect reset code/i);
    });

    it('updates password and clears OTP on success', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, otpCode: otpHash, otpExpiry: new Date(Date.now() + 60_000),
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      prisma.authUser.update.mockResolvedValueOnce({} as any);
      prisma.activityLog.create.mockResolvedValueOnce({} as any);

      const res = await service.resetPassword('john@example.com', '123456', 'Valid1234');
      expect(prisma.authUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ otpCode: null, otpExpiry: null, refreshToken: null }) }),
      );
      expect(res.message).toMatch(/updated successfully/i);
    });
  });

  // ── verifyMagicLink (inspect only, no login) ─────────────────────
  describe('verifyMagicLink()', () => {
    it('rejects a malformed/garbage token', async () => {
      await expect(service.verifyMagicLink('not-a-real-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a token with the wrong purpose', async () => {
      const token = makeMagicToken({ purpose: 'something_else' });
      await expect(service.verifyMagicLink(token)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the client no longer exists', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.verifyMagicLink(token)).rejects.toThrow(UnauthorizedException);
    });

    it('reports requiresPasswordSetup=true when no SECONDARY AuthUser exists yet', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.authUser.findFirst.mockResolvedValueOnce(null);
      const res = await service.verifyMagicLink(token);
      expect(res.requiresPasswordSetup).toBe(true);
      expect(res.clientRef).toBe(MOCK.client.clientRef);
    });

    it('reports requiresPasswordSetup=false once the secondary holder already has a login', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce(MOCK.client as any);
      prisma.authUser.findFirst.mockResolvedValueOnce({ id: 'secondary-auth-1', holderType: 'SECONDARY' } as any);
      const res = await service.verifyMagicLink(token);
      expect(res.requiresPasswordSetup).toBe(false);
    });
  });

  // ── setSecondaryPassword (creates the secondary holder's own login) ──
  describe('setSecondaryPassword()', () => {
    it('rejects a password shorter than 8 characters', async () => {
      const token = makeMagicToken();
      await expect(service.setSecondaryPassword(token, 'short')).rejects.toThrow(/at least 8 characters/i);
    });

    it('rejects an invalid/garbage token', async () => {
      await expect(service.setSecondaryPassword('garbage', 'ValidPass1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws if the client no longer exists', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(service.setSecondaryPassword(token, 'ValidPass1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws if there is no secondary email on file at all', async () => {
      const token = makeMagicToken({ secondaryEmail: undefined as any });
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, secondaryEmail: null } as any);
      await expect(service.setSecondaryPassword(token, 'ValidPass1')).rejects.toThrow(/no secondary holder email/i);
    });

    it('throws ConflictException if the secondary holder already set up access', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, secondaryEmail: 'jane@example.com' } as any);
      prisma.authUser.findFirst.mockResolvedValueOnce({ id: 'existing-secondary' } as any);
      await expect(service.setSecondaryPassword(token, 'ValidPass1')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if the secondary email is already registered elsewhere', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, secondaryEmail: 'jane@example.com' } as any);
      prisma.authUser.findFirst.mockResolvedValueOnce(null);
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: 'someone-else' } as any);
      await expect(service.setSecondaryPassword(token, 'ValidPass1')).rejects.toThrow(ConflictException);
    });

    it('creates a SECONDARY AuthUser (separate from primary) and returns session tokens', async () => {
      const token = makeMagicToken();
      prisma.client.findUnique.mockResolvedValueOnce({ ...MOCK.client, secondaryEmail: 'jane@example.com', secondaryName: 'Jane Doe' } as any);
      prisma.authUser.findFirst.mockResolvedValueOnce(null); // no existing secondary
      prisma.authUser.findUnique.mockResolvedValueOnce(null); // email not taken
      prisma.authUser.create.mockResolvedValueOnce({
        id: 'secondary-auth-1', email: 'jane@example.com', role: 'joint', clientId: IDS.CLIENT_DB, holderType: 'SECONDARY',
      } as any);

      const res = await service.setSecondaryPassword(token, 'ValidPass1');
      expect(prisma.authUser.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'jane@example.com', holderType: 'SECONDARY', clientId: IDS.CLIENT_DB }) }),
      );
      expect(res.accessToken).toBeTruthy();
      expect(res.user.holderType).toBe('SECONDARY');
      expect(res.user.name).toBe('Jane Doe');
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

  // ── refresh (session rotation) ────────────────────────────────────
  describe('refresh()', () => {
    const rawToken = 'refresh-token-abc';

    it('issues fresh tokens and rotates the session', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, refreshToken: 'bcrypt-hash', adminUser: null,
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      prisma.session.findUnique.mockResolvedValueOnce({ token: 'session-hash' } as any);
      prisma.session.deleteMany.mockResolvedValueOnce({ count: 1 } as any);

      const res = await service.refresh(IDS.AUTH_USER, rawToken);
      expect(res).toHaveProperty('accessToken');
      expect(res).toHaveProperty('refreshToken');
      expect(prisma.session.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: expect.any(String) } }),
      );
    });

    it('blocks refresh when the session has been revoked (logout/lock/reset)', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, refreshToken: 'bcrypt-hash', adminUser: null,
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      prisma.session.findUnique.mockResolvedValueOnce(null); // no live session
      await expect(service.refresh(IDS.AUTH_USER, rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('blocks refresh for an inactive account', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, refreshToken: 'bcrypt-hash', isActive: false, adminUser: null,
      } as any);
      await expect(service.refresh(IDS.AUTH_USER, rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('blocks refresh when the admin profile is locked', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, refreshToken: 'bcrypt-hash', adminUser: { role: 'FINANCE', status: 'LOCKED' },
      } as any);
      await expect(service.refresh(IDS.AUTH_USER, rawToken)).rejects.toThrow(UnauthorizedException);
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

    it('never selects sensitive auth secrets (passwordHash, refreshToken, otpCode)', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce({
        ...MOCK.authUser, client: MOCK.client, adminUser: null,
      } as any);
      await service.getMe(IDS.AUTH_USER);
      const callArgs = prisma.authUser.findUnique.mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.select.passwordHash).toBeUndefined();
      expect(callArgs.select.refreshToken).toBeUndefined();
      expect(callArgs.select.otpCode).toBeUndefined();
      expect(callArgs.select.passwordResetToken).toBeUndefined();
    });
  });
});
