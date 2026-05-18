import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import { RegisterIndividualDto } from './dto/register-individual.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ── Login ────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { email: dto.email },
      include: { client: true, adminUser: true },
    });

    if (!authUser) throw new UnauthorizedException('Invalid credentials');
    if (!authUser.isActive) throw new UnauthorizedException('Account is locked or inactive');

    const passwordOk = await bcrypt.compare(dto.password, authUser.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    // Update last login
    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(authUser.id, authUser.email, authUser.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        name: authUser.client?.name ?? authUser.adminUser?.name,
        clientId: authUser.client?.clientRef ?? authUser.adminUser?.adminRef,
        adminRole: authUser.adminUser?.role ?? null,
        clientType: authUser.client?.type ?? null,
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

    return { message: 'Corporate account created. Please complete KYC.', clientRef: result.client.clientRef };
  }

  // ── Register Individual / Joint ──────────────────────────────────
  async registerIndividual(dto: RegisterIndividualDto) {
    const exists = await this.prisma.authUser.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const clientRef = await this.generateClientRef();
    const isJoint = dto.accountType === 'joint';

    const result = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          clientRef,
          type: isJoint ? 'JOINT' : 'INDIVIDUAL',
          status: 'PENDING_KYC',
          name: dto.primaryName,
          email: dto.email,
          secondaryName: isJoint ? dto.secondaryName : undefined,
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

      return { client, authUser };
    });

    return { message: 'Account created. Please complete KYC.', clientRef: result.client.clientRef };
  }

  // ── Get current user ─────────────────────────────────────────────
  async getMe(authUserId: string) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: authUserId },
      include: {
        client: { include: { kycRecord: true } },
        adminUser: true,
      },
    });
    if (!authUser) throw new NotFoundException('User not found');
    return authUser;
  }

  // ── Refresh tokens ───────────────────────────────────────────────
  async refresh(authUserId: string, refreshToken: string) {
    const authUser = await this.prisma.authUser.findUnique({ where: { id: authUserId } });
    if (!authUser || !authUser.refreshToken) throw new UnauthorizedException();
    const valid = await bcrypt.compare(refreshToken, authUser.refreshToken);
    if (!valid) throw new UnauthorizedException();
    return this.generateTokens(authUser.id, authUser.email, authUser.role);
  }

  // ── Forgot password (sends OTP) ──────────────────────────────────
  async forgotPassword(email: string) {
    const authUser = await this.prisma.authUser.findUnique({ where: { email } });
    if (!authUser) return { message: 'If that email exists, a reset link has been sent.' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: { otpCode: await bcrypt.hash(otp, 10), otpExpiry: expiry },
    });

    // TODO: send OTP via Nodemailer (NotificationsService.sendOtpEmail)
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ── Logout ───────────────────────────────────────────────────────
  async logout(authUserId: string) {
    await this.prisma.authUser.update({
      where: { id: authUserId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out' };
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
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

  private async generateClientRef(): Promise<string> {
    const count = await this.prisma.client.count();
    return `CLI-${String(count + 1).padStart(3, '0')}`;
  }
}
