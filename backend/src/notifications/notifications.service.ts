import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.config.get('SMTP_PORT', '587')),
      secure: false, // true for 465
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    const from = this.config.get('EMAIL_FROM') || 'noreply@prodigyfinance.ng';

    try {
      const info = await this.transporter.sendMail({
        from: `"Prodigy Finance" <${from}>`,
        to,
        subject,
        html: body,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, to, subject, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return { success: false, to, subject, error: error.message };
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    return this.sendEmail(
      to,
      'Your Prodigy Finance OTP',
      `Your verification code is: ${otp}. It expires in 10 minutes.`,
    );
  }

  async sendKycApprovalEmail(to: string, status: 'approved' | 'rejected') {
    const subject = status === 'approved' ? 'KYC Approved' : 'KYC Review Required';
    const body = status === 'approved'
      ? 'Your KYC documents have been approved. You can now access all platform features.'
      : 'Your KYC submission requires attention. Please log in to review the feedback.';
    return this.sendEmail(to, subject, body);
  }

  async getNotifications(userId?: string) {
    if (!userId) return [];
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
