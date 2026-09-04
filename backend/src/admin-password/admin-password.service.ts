import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminPasswordService {
  private readonly logger = new Logger(AdminPasswordService.name);
  private readonly PASSWORD_EXPIRY_DAYS = 60; // 2 months

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Check if admin password is expired.
   * Returns true if expired or never set.
   */
  async isPasswordExpired(adminUserId: string): Promise<boolean> {
    const authUser = await this.prisma.authUser.findUnique({
      where: { adminUserId },
      select: { passwordChangedAt: true, passwordExpired: true },
    });

    if (!authUser) throw new NotFoundException('Admin user not found');

    // If flag is set, it's expired
    if (authUser.passwordExpired) return true;

    // If never changed, it's expired
    if (!authUser.passwordChangedAt) return true;

    // Check if older than 60 days
    const expiryDate = new Date(authUser.passwordChangedAt);
    expiryDate.setDate(expiryDate.getDate() + this.PASSWORD_EXPIRY_DAYS);

    return new Date() > expiryDate;
  }

  /**
   * Mark admin password as expired.
   */
  async markPasswordExpired(adminUserId: string): Promise<void> {
    await this.prisma.authUser.update({
      where: { adminUserId },
      data: { passwordExpired: true },
    });
  }

  /**
   * Update password and reset expiry.
   */
  async updatePassword(adminUserId: string, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, 12);

    const authUser = await this.prisma.authUser.findUnique({
      where: { adminUserId },
      select: { id: true },
    });
    if (!authUser) throw new NotFoundException('Admin user not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.authUser.update({
        where: { adminUserId },
        data: {
          passwordHash: hash,
          passwordChangedAt: new Date(),
          passwordExpired: false,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      // Revoke all sessions - password change must invalidate all devices
      await tx.session.deleteMany({ where: { authUserId: authUser.id } });
    });

    // Audit log
    const adminUser = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (adminUser) {
      await this.notifications.sendPasswordChangedEmail(adminUser.email).catch(() => {});
    }
  }

  /**
   * Initiate forgot password flow for admin.
   * Generates secure reset token, sends email.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const authUser = await this.prisma.authUser.findUnique({
      where: { email },
      include: { adminUser: true },
    });

    // Always return success to prevent email enumeration
    if (!authUser || !authUser.adminUserId) {
      this.logger.log(`Password reset requested for non-admin or non-existent email: ${email}`);
      return;
    }

    const adminUser = authUser.adminUser;
    if (!adminUser || adminUser.status !== 'ACTIVE') {
      this.logger.warn(`Password reset requested for locked/deleted admin: ${email}`);
      return;
    }

    // Generate secure random token (32 bytes = 256 bits)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenPrefix = resetToken.substring(0, 8); // First 8 chars for indexed lookup
    const tokenHash = await bcrypt.hash(resetToken, 12);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetTokenPrefix: tokenPrefix,
        passwordResetExpiry: expiry,
      },
    });

    // Send reset email with token
    const resetUrl = `${this.config.get('ADMIN_APP_URL', 'http://localhost:3000')}/admin/reset-password?token=${resetToken}`;
    await this.notifications.sendEmail(
      authUser.email,
      'Admin Password Reset — Prodigy Finance',
      `<p>You requested a password reset for your admin account.</p>
       <p>Click the link below to set a new password (expires in 1 hour):</p>
       <p><a href="${resetUrl}">Reset Password</a></p>
       <p>If you did not request this, please ignore this email and contact support immediately.</p>`,
    ).catch((err) => this.logger.error(`Failed to send reset email: ${err.message}`));
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find auth user with valid (non-expired) reset token using prefix for efficient lookup
    const tokenPrefix = token.substring(0, 8);
    const authUsers = await this.prisma.authUser.findMany({
      where: {
        passwordResetExpiry: { gt: new Date() },
        passwordResetToken: { not: null },
        passwordResetTokenPrefix: tokenPrefix,
      },
      include: { adminUser: true },
    });

    let matchedAuthUser: typeof authUsers[0] | null = null;
    for (const authUser of authUsers) {
      if (authUser.passwordResetToken) {
        const isMatch = await bcrypt.compare(token, authUser.passwordResetToken);
        if (isMatch) {
          matchedAuthUser = authUser;
          break;
        }
      }
    }

    if (!matchedAuthUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!matchedAuthUser.adminUserId) {
      throw new BadRequestException('This reset token is not for an admin account');
    }

    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: matchedAuthUser.adminUserId },
    });

    if (!adminUser || adminUser.status !== 'ACTIVE') {
      throw new BadRequestException('Admin account is not active');
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.authUser.update({
        where: { id: matchedAuthUser!.id },
        data: {
          passwordHash: hash,
          passwordChangedAt: new Date(),
          passwordExpired: false,
          passwordResetToken: null,
          passwordResetTokenPrefix: null,
          passwordResetExpiry: null,
        },
      });

      // Revoke all sessions
      await tx.session.deleteMany({ where: { authUserId: matchedAuthUser!.id } });
    });

    // Send confirmation email
    await this.notifications.sendEmail(
      matchedAuthUser!.email,
      'Admin Password Reset Successful — Prodigy Finance',
      '<p>Your admin password has been successfully reset. If you did not perform this action, please contact support immediately.</p>',
    ).catch(() => {});
  }

  /**
   * Get password expiry info for an admin.
   */
  async getPasswordExpiryInfo(adminUserId: string): Promise<{
    expired: boolean;
    expiresAt: Date | null;
    daysRemaining: number | null;
  }> {
    const authUser = await this.prisma.authUser.findUnique({
      where: { adminUserId },
      select: { passwordChangedAt: true, passwordExpired: true },
    });

    if (!authUser) throw new NotFoundException('Admin user not found');

    if (authUser.passwordExpired || !authUser.passwordChangedAt) {
      return { expired: true, expiresAt: null, daysRemaining: 0 };
    }

    const expiresAt = new Date(authUser.passwordChangedAt);
    expiresAt.setDate(expiresAt.getDate() + this.PASSWORD_EXPIRY_DAYS);

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      expired: now > expiresAt,
      expiresAt,
      daysRemaining,
    };
  }
}