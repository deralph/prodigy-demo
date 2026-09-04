import { Controller, Post, Get, Body, UseGuards, Req, Param, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPasswordService } from './admin-password.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@ApiTags('Admin — Password Management')
@ApiBearerAuth()
@Controller('admin/password')
export class AdminPasswordController {
  constructor(
    private adminPasswordService: AdminPasswordService,
    private prisma: PrismaService,
  ) {}

  @Get('expiry')
  @ApiOperation({ summary: 'Get current admin password expiry status' })
  async getExpiryStatus(@Req() req: any) {
    if (!req.user.adminUserId) {
      throw new BadRequestException('Not an admin user');
    }
    return this.adminPasswordService.getPasswordExpiryInfo(req.user.adminUserId);
  }

  @Post('change')
  @ApiOperation({ summary: 'Change admin password (must know current password)' })
  async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    if (!req.user.adminUserId) {
      throw new BadRequestException('Not an admin user');
    }

    // Verify current password
    const authUser = await this.prisma.authUser.findUnique({
      where: { adminUserId: req.user.adminUserId },
      select: { passwordHash: true },
    });

    if (!authUser || !authUser.passwordHash) {
      throw new BadRequestException('Admin user not found');
    }

    const isMatch = await bcrypt.compare(body.currentPassword, authUser.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.adminPasswordService.updatePassword(req.user.adminUserId, body.newPassword);
    return { message: 'Password updated successfully' };
  }
}

@ApiTags('Admin — Password Management (Public)')
@Controller('admin/password/public')
export class AdminPasswordPublicController {
  constructor(
    private adminPasswordService: AdminPasswordService,
    private prisma: PrismaService,
  ) {}

  @Post('forgot')
  @ApiOperation({ summary: 'Request admin password reset (sends email with reset link)' })
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    await this.adminPasswordService.requestPasswordReset(body.email);
    return { message: 'If the email exists and is associated with an active admin account, a reset link has been sent.' };
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset admin password using token from email' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body.token || !body.newPassword) {
      throw new BadRequestException('Token and new password are required');
    }
    await this.adminPasswordService.resetPassword(body.token, body.newPassword);
    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  @Get('validate-token/:token')
  @ApiOperation({ summary: 'Validate a reset token without consuming it' })
  async validateToken(@Param('token') token: string) {
    const authUsers = await this.prisma.authUser.findMany({
      where: {
        passwordResetExpiry: { gt: new Date() },
        passwordResetToken: { not: null },
      },
      include: { adminUser: true },
    });

    let isValid = false;
    for (const authUser of authUsers) {
      if (authUser.passwordResetToken) {
        const isMatch = await bcrypt.compare(token, authUser.passwordResetToken);
        if (isMatch) {
          return { valid: true };
        }
      }
    }
    return { valid: false };
  }
}