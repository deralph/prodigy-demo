import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import { RegisterIndividualDto } from './dto/register-individual.dto';
import { LoginDto } from './dto/login.dto';
import { NibssService } from '../nibss/nibss.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notifications: NotificationsService,
    private onboarding: OnboardingService,
    private nibssService: NibssService,
  ) {}

  // ── Login ────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { email: dto.email },
      include: { client: true, adminUser: true },
    });

    if (!authUser) throw new UnauthorizedException('Invalid credentials');
    if (!authUser.isActive) {
      if (authUser.adminUserId) {
        await logAdminAction(this.prisma, {
          adminId: authUser.adminUserId, adminRole: authUser.adminUser?.role,
          action: 'ADMIN_LOGIN_FAILED', category: 'AUTH',
          metadata: { email: dto.email, reason: 'account_inactive' },
        });
      }
      throw new UnauthorizedException('Account is locked or inactive');
    }
    // An admin whose AdminUser profile is locked/deleted must not be able to
    // sign in, even if their AuthUser row is still technically active.
    if (authUser.adminUser && authUser.adminUser.status !== 'ACTIVE') {
      await logAdminAction(this.prisma, {
        adminId: authUser.adminUserId, adminRole: authUser.adminUser?.role,
        action: 'ADMIN_LOGIN_FAILED', category: 'AUTH',
        metadata: { email: dto.email, reason: `admin_status_${authUser.adminUser.status}` },
      });
      throw new UnauthorizedException('Account is locked or inactive');
    }

    const passwordOk = await bcrypt.compare(dto.password, authUser.passwordHash);
    if (!passwordOk) {
      if (authUser.adminUserId) {
        await logAdminAction(this.prisma, {
          adminId: authUser.adminUserId, adminRole: authUser.adminUser?.role,
          action: 'ADMIN_LOGIN_FAILED', category: 'AUTH',
          metadata: { email: dto.email, reason: 'invalid_password' },
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    const isFirstLogin = !authUser.lastLoginAt;
    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(
      authUser.id,
      authUser.email,
      authUser.role,
      authUser.clientId,
      authUser.adminUserId,
      authUser.adminUser?.role ?? null,
      authUser.holderType,
    );

    // Persist a revocable session for this refresh token.
    await this.createSession(authUser.id, tokens.refreshToken);

    if (authUser.adminUserId) {
      await logAdminAction(this.prisma, {
        adminId: authUser.adminUserId, adminRole: authUser.adminUser?.role,
        action: 'ADMIN_LOGIN_SUCCESS', category: 'AUTH',
        metadata: { email: dto.email },
      });
    }

    // Trigger onboarding communication for first login after KYC activation
    if (isFirstLogin && authUser.clientId && authUser.client?.status === 'ACTIVE') {
      this.onboarding.onFirstLoginAfterActivation(authUser.clientId).catch(() => {});
    }

    const isSecondaryHolder = authUser.holderType === 'SECONDARY';

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        name: isSecondaryHolder ? (authUser.client?.secondaryName ?? authUser.client?.name) : (authUser.client?.name ?? authUser.adminUser?.name),
        clientId: authUser.client?.clientRef ?? authUser.adminUser?.adminRef,
        adminRole: authUser.adminUser?.role ?? null,
        clientType: authUser.client?.type ?? null,
        holderType: authUser.holderType,
      },
    };
  }

  // ── Register Corporate ──────────────────────────────────────────
  async registerCorporate(dto: RegisterCorporateDto) {
    const exists = await this.prisma.authUser.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const clientRef = await this.generateClientRef();

    const result = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          clientRef,
          type: 'CORPORATE',
          status: 'PENDING_KYC',
          name: dto.entityName,
          email: dto.email,
          phone: dto.phone,
          rcNumber: (dto as any).rcNumber,
        },
      });

      const authUser = await tx.authUser.create({
        data: {
          email: dto.email,
          passwordHash: hash,
          role: 'corporate',
          clientId: client.id,
        },
      });

      // Create empty KYC record
      await tx.kycRecord.create({ data: { clientId: client.id } });

      return { client, authUser };
    });

    await this.onboarding.onClientRegistered(result.client.id);
    return { message: 'Corporate account created. Please complete KYC.', clientRef: result.client.clientRef };
  }

  // ── Register Individual / Joint ──────────────────────────────────
  async registerIndividual(dto: RegisterIndividualDto) {
    const exists = await this.prisma.authUser.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const identityInputs = this.getRegistrationIdentityInputs(dto);
    await this.assertBvnReuseIsSafe(identityInputs);
    const verifiedIdentities = await Promise.all(identityInputs.map(async (identity) => {
      const result = await this.nibssService.verifyBvn(identity.bvn, identity.name, { email: identity.email, phone: identity.phone });
      if (!result.verified) throw new BadRequestException(result.message);
      return {
        type: 'bvn',
        identifierHash: this.hashSensitiveIdentifier(identity.bvn),
        nameNormalized: this.normalizeIdentityName(identity.name),
        provider: result.provider ?? 'qoreid',
        providerReference: result.providerReference,
        verifiedAt: result.verifiedAt,
      };
    }));

    const hash = await bcrypt.hash(dto.password, 12);
    const clientRef = await this.generateClientRef();
    const isJoint = dto.accountType === 'joint';

    // The secondary holder's display info can arrive two ways: the flat
    // secondaryName/secondaryEmail/secondaryPhone fields, or as the second
    // entry of holderIdentities[]. Prefer the flat fields when given, but
    // fall back to holderIdentities[1] so a holder onboarded that way is
    // never silently dropped from the account record or missed for the
    // magic-link invite below.
    const secondHolderIdentity = isJoint ? dto.holderIdentities?.[1] : undefined;
    const secondaryName  = isJoint ? (dto.secondaryName  || secondHolderIdentity?.name)  : undefined;
    const secondaryEmail = isJoint ? (dto.secondaryEmail || secondHolderIdentity?.email) : undefined;
    const secondaryPhone = isJoint ? (dto.secondaryPhone || secondHolderIdentity?.phone) : undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          clientRef,
          type: isJoint ? 'JOINT' : 'INDIVIDUAL',
          status: 'PENDING_KYC',
          name: dto.primaryName,
          email: dto.email,
          phone: dto.phone,
          secondaryName,
          secondaryEmail,
          secondaryPhone,
          mandateType: isJoint ? 'AND' : undefined,
        },
      });

      const authUser = await tx.authUser.create({
        data: {
          email: dto.email,
          passwordHash: hash,
          role: isJoint ? 'joint' : 'individual',
          clientId: client.id,
        },
      });

      await tx.kycRecord.create({ data: { clientId: client.id } });
      await Promise.all(verifiedIdentities.map((identity) => tx.identityVerification.create({
        data: { ...identity, clientId: client.id },
      })));

      return { client, authUser };
    });

    await this.onboarding.onClientRegistered(result.client.id);

    if (isJoint && secondaryEmail) {
      const magicToken = await this.generateMagicToken(result.client.id, result.client.clientRef, secondaryEmail);
      const magicLink = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/magic-login?token=${magicToken}`;
      this.notifications.sendEmail(
        secondaryEmail,
        'You have been added as a Joint Account Holder — Prodigy Finance',
        `<p>Dear ${secondaryName || 'Co-holder'},</p><p><strong>${dto.primaryName}</strong> has created a joint investment account with you on Prodigy Finance.</p><p>Your Account ID is <strong>${result.client.clientRef}</strong>.</p><p>Click the link below to accept, set your own password, and complete your KYC:</p><p><a href="${magicLink}" style="background:#0d1b35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Access Your Joint Account</a></p><p>This link expires in 48 hours.</p><p>Best regards,<br/>Prodigy Finance Team</p>`,
      ).catch(() => {});
    }

    return { message: 'Account created. Please complete KYC.', clientRef: result.client.clientRef };
  }


  private getRegistrationIdentityInputs(dto: RegisterIndividualDto) {
    const primaryBvn = this.cleanBvn(dto.bvn);
    const identities = dto.accountType === 'joint' && dto.holderIdentities?.length
      ? dto.holderIdentities.map((holder, index) => ({
          name: holder.name,
          bvn: this.cleanBvn(holder.bvn),
          email: holder.email,
          phone: holder.phone,
          holderIndex: index,
        }))
      : [{ name: dto.primaryName, bvn: primaryBvn, email: dto.email, phone: dto.phone, holderIndex: 0 }];

    if (dto.accountType === 'single' && !primaryBvn) throw new BadRequestException('BVN is required for account authentication.');
    if (dto.accountType === 'joint' && identities.length < 2) throw new BadRequestException('BVN is required for every joint account holder.');

    const seen = new Map<string, string>();
    for (const identity of identities) {
      if (identity.bvn.length !== 11) throw new BadRequestException('BVN must be exactly 11 digits.');
      const normalizedName = this.normalizeIdentityName(identity.name);
      if (seen.has(identity.bvn)) {
        throw new ConflictException('The same BVN cannot be used by multiple holders on one account.');
      }
      seen.set(identity.bvn, normalizedName);
    }

    return identities;
  }

  private async assertBvnReuseIsSafe(identities: Array<{ bvn: string; name: string }>) {
    for (const identity of identities) {
      const identifierHash = this.hashSensitiveIdentifier(identity.bvn);
      const existing = await this.prisma.identityVerification.findMany({
        where: { type: 'bvn', identifierHash },
        select: { nameNormalized: true },
      });
      const normalizedName = this.normalizeIdentityName(identity.name);
      const hasConflictingIdentity = existing.some((row) => row.nameNormalized !== normalizedName);
      if (hasConflictingIdentity) {
        throw new ConflictException('This BVN is already linked to a different customer profile.');
      }
    }
  }

  private hashSensitiveIdentifier(value: string): string {
    const pepper = process.env.BVN_HASH_PEPPER ?? process.env.JWT_SECRET;
    if (!pepper) throw new BadRequestException('BVN hashing secret is not configured.');
    return createHmac('sha256', pepper).update(this.cleanBvn(value)).digest('hex');
  }

  private cleanBvn(value?: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private normalizeIdentityName(value: string): string {
    return (value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
  }

  // ── Get current user ─────────────────────────────────────────────
  async getMe(authUserId: string) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: authUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        holderType: true,
        lastLoginAt: true,
        createdAt: true,
        client: { include: { kycRecord: true } },
        adminUser: true,
        // Deliberately NOT selected: passwordHash, refreshToken, otpCode,
        // otpExpiry, passwordResetToken, passwordResetExpiry. These are
        // internal auth secrets (hashed, but still sensitive) and must
        // never be sent to the client or land in browser storage.
      },
    });
    if (!authUser) throw new NotFoundException('User not found');
    return authUser;
  }

  // ── Refresh tokens ───────────────────────────────────────────────
  async refresh(authUserId: string, refreshToken: string) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: authUserId },
      include: { adminUser: true },
    });
    if (!authUser || !authUser.refreshToken) throw new UnauthorizedException();
    if (!authUser.isActive) throw new UnauthorizedException('Account is locked or inactive');
    if (authUser.adminUser && authUser.adminUser.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is locked or inactive');
    }
    const valid = await bcrypt.compare(refreshToken, authUser.refreshToken);
    if (!valid) throw new UnauthorizedException();

    // Session rotation: the presented refresh token must correspond to a live
    // session. A revoked session (logout / lock / reset) blocks refresh even
    // if the raw token is somehow still valid.
    const sessionToken = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { token: sessionToken } });
    if (!session) throw new UnauthorizedException('Session has been revoked. Please sign in again.');

    // Rotate: drop the old session, issue fresh tokens, persist a new session.
    await this.prisma.session.deleteMany({ where: { authUserId, token: sessionToken } });
    const tokens = await this.generateTokens(
      authUser.id,
      authUser.email,
      authUser.role,
      authUser.clientId,
      authUser.adminUserId,
      authUser.adminUser?.role ?? null,
      authUser.holderType,
    );
    await this.createSession(authUser.id, tokens.refreshToken);
    return tokens;
  }

  // ── Forgot password (sends OTP) ──────────────────────────────────
  async forgotPassword(email: string) {
    // Always return the same generic message regardless of whether the
    // email exists — prevents user enumeration attacks.
    const authUser = await this.prisma.authUser.findUnique({ where: { email } });
    if (!authUser) return { message: 'If that email exists, a reset code has been sent.' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: { otpCode: await bcrypt.hash(otp, 10), otpExpiry: expiry },
    });

    this.notifications.sendOtpEmail(email, otp).catch(() => {});
    return { message: 'If that email exists, a reset code has been sent.' };
  }

  // Resend a fresh OTP for the same email (rate-limited in production
  // by the auth controller — identical to forgotPassword but explicit).
  async resendOtp(email: string) {
    return this.forgotPassword(email);
  }

  // ── Reset password (verify OTP + set new password) ───────────────
  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      );
    }

    const authUser = await this.prisma.authUser.findUnique({ where: { email } });
    if (!authUser || !authUser.otpCode || !authUser.otpExpiry) {
      throw new BadRequestException('No password reset was requested for this email.');
    }
    if (new Date() > authUser.otpExpiry) {
      throw new BadRequestException('Reset code has expired. Please request a new one.');
    }
    const otpValid = await bcrypt.compare(otp, authUser.otpCode);
    if (!otpValid) {
      throw new BadRequestException('Incorrect reset code. Please check your email and try again.');
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.authUser.update({
        where: { id: authUser.id },
        data: { passwordHash: hash, otpCode: null, otpExpiry: null, refreshToken: null },
      }),
      // Revoke every session — a password change must invalidate all devices.
      this.prisma.session.deleteMany({ where: { authUserId: authUser.id } }),
    ]);

    // Audit trail for password changes (important for financial services).
    if (authUser.clientId) {
      try {
        await this.prisma.activityLog.create({
          data: {
            clientId: authUser.clientId,
            action: 'PASSWORD_RESET',
            description: `Password reset completed for ${email}`,
            metadata: { email } as any,
          },
        });
      } catch { /* never block the happy path */ }
    }

    this.notifications.sendPasswordChangedEmail(email).catch(() => {});

    return { message: 'Password updated successfully. You can now sign in.' };
  }

  // ── Logout ───────────────────────────────────────────────────────
  async logout(authUserId: string) {
    await this.prisma.$transaction([
      this.prisma.authUser.update({
        where: { id: authUserId },
        data: { refreshToken: null },
      }),
      this.prisma.session.deleteMany({ where: { authUserId } }),
    ]);
    return { message: 'Logged out' };
  }

  // ── Helpers ──────────────────────────────────────────────────────
  /** One-way hash used to store session tokens (never store raw refresh tokens). */
  private hashToken(token: string): string {
    return createHmac('sha256', process.env.JWT_SECRET ?? 'prodigy-session').update(token).digest('hex');
  }

  private refreshTtlMs(): number {
    const raw = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]]!;
    return Number(match[1]) * unit;
  }

  /** Persist a revocable session row for a refresh token (stores only a hash). */
  private async createSession(authUserId: string, refreshToken: string) {
    try {
      await this.prisma.session.create({
        data: {
          token: this.hashToken(refreshToken),
          authUserId,
          expiresAt: new Date(Date.now() + this.refreshTtlMs()),
        },
      });
    } catch {
      // A session write must never break the login flow — the raw refresh
      // token is still persisted (hashed) on the AuthUser row as before.
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    clientId?: string | null,
    adminUserId?: string | null,
    adminRole?: string | null,
    holderType?: string | null,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      clientId: clientId ?? null,
      adminUserId: adminUserId ?? null,
      adminRole: adminRole ?? null,
      holderType: holderType ?? null,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
    ]);

    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.authUser.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });

    return { accessToken, refreshToken };
  }

  // ── Magic link verification ────────────────────────────────────
  /**
   * Inspect a joint-account magic link without consuming it.
   * Tells the frontend whether the secondary holder still needs to set
   * their own password (first visit) or already has an account.
   */
  async verifyMagicLink(token: string) {
    const payload = this.decodeMagicToken(token);
    const client = await this.prisma.client.findUnique({ where: { id: payload.clientId } });
    if (!client) throw new UnauthorizedException('Account not found');

    const existingSecondary = await this.prisma.authUser.findFirst({
      where: { clientId: client.id, holderType: 'SECONDARY' },
    });

    return {
      requiresPasswordSetup: !existingSecondary,
      clientRef: client.clientRef,
      primaryName: client.name,
      secondaryName: client.secondaryName,
      secondaryEmail: client.secondaryEmail ?? payload.secondaryEmail,
    };
  }

  /**
   * Secondary holder sets their own password for the first time via the
   * magic link, creating their own independent login. Logs them in
   * immediately. From then on they use email + password normally.
   */
  async setSecondaryPassword(token: string, password: string) {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
    const payload = this.decodeMagicToken(token);
    const client = await this.prisma.client.findUnique({ where: { id: payload.clientId } });
    if (!client) throw new UnauthorizedException('Account not found');

    const secondaryEmail = client.secondaryEmail ?? payload.secondaryEmail;
    if (!secondaryEmail) {
      throw new BadRequestException('No secondary holder email is on file for this account. Please contact support.');
    }

    const existingSecondary = await this.prisma.authUser.findFirst({
      where: { clientId: client.id, holderType: 'SECONDARY' },
    });
    if (existingSecondary) {
      throw new ConflictException('Access has already been set up for this holder. Please log in normally.');
    }

    const emailTaken = await this.prisma.authUser.findUnique({ where: { email: secondaryEmail } });
    if (emailTaken) {
      throw new ConflictException('This email is already registered to another account. Please contact support.');
    }

    const hash = await bcrypt.hash(password, 12);
    const authUser = await this.prisma.authUser.create({
      data: {
        email: secondaryEmail,
        passwordHash: hash,
        role: 'joint',
        clientId: client.id,
        holderType: 'SECONDARY',
      },
    });

    const tokens = await this.generateTokens(
      authUser.id, authUser.email, authUser.role,
      client.id, null, null, 'SECONDARY',
    );

    await this.createSession(authUser.id, tokens.refreshToken);

    this.notifications.sendSecondaryHolderJoinedEmail(
      client.email, client.name, client.secondaryName || 'Your co-holder',
    ).catch(() => {});

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        name: client.secondaryName ?? client.name,
        clientId: client.clientRef,
        clientType: client.type,
        holderType: 'SECONDARY',
      },
    };
  }

  private decodeMagicToken(token: string): { clientId: string; clientRef: string; secondaryEmail?: string; purpose?: string } {
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: process.env.JWT_MAGIC_SECRET ?? process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException('Magic link is invalid or expired.');
    }
    if (payload.purpose !== 'joint_secondary_setup' || !payload.clientId) {
      throw new UnauthorizedException('Magic link is invalid or expired.');
    }
    return payload;
  }

  private async generateMagicToken(clientId: string, clientRef: string, secondaryEmail: string): Promise<string> {
    return this.jwt.signAsync(
      { clientId, clientRef, secondaryEmail, purpose: 'joint_secondary_setup' },
      { secret: process.env.JWT_MAGIC_SECRET ?? process.env.JWT_SECRET, expiresIn: '48h' },
    );
  }

  private async generateClientRef(): Promise<string> {
    const count = await this.prisma.client.count();
    return `CLI-${String(count + 1).padStart(3, '0')}`;
  }
}
