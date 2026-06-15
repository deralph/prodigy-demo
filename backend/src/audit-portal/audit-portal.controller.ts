import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditPortalService } from './audit-portal.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit Portal')
@Controller('audit-portal')
export class AuditPortalController {
  constructor(
    private readonly auditPortalService: AuditPortalService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post('generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate an external audit portal token and email the link' })
  async generate(@Req() req: any, @Body() body: { email: string }) {
    if (!req.user.clientDbId) {
      return { message: 'Admin users do not have an audit portal. Please use a client account.' };
    }
    const { token, email, expiresAt } = await this.auditPortalService.generateToken(
      req.user.clientDbId,
      body.email,
    );

    const portalUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/audit-portal?token=${token}`;

    await this.notifications.sendEmail(
      email,
      'External Audit Portal Access — Prodigy Finance',
      `<p>Hello,</p>
<p>An external audit portal link has been generated for <strong>${req.user.email}</strong>.</p>
<p><strong>Portal URL:</strong><br/><a href="${portalUrl}">${portalUrl}</a></p>
<p><strong>Expires:</strong> ${expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
<p><strong>One-time use.</strong> The link will become invalid after first access.</p>
<p>Best regards,<br/>Prodigy Finance Team</p>`,
    );

    return { message: 'Audit portal link generated and emailed.', email, expiresAt };
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify an audit token and return client audit data' })
  async verify(@Query('token') token: string) {
    return this.auditPortalService.verifyToken(token);
  }
}
