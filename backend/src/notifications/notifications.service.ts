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

  async sendKycApprovalEmail(to: string, status: 'approved' | 'rejected', reason?: string) {
    const subject = status === 'approved' ? 'KYC Approved — Prodigy Finance' : 'KYC Review Required — Prodigy Finance';
    const body = status === 'approved'
      ? `<p>Good news — your KYC documents have been approved. You can now access all platform features, including investing and withdrawals.</p>`
      : `<p>Your KYC submission needs attention.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}<p>Please log in to review and resubmit the affected document(s).</p>`;
    return this.sendEmail(to, subject, this.wrap(body));
  }

  async sendKycSubmittedEmail(to: string, clientName: string) {
    return this.sendEmail(
      to,
      'KYC Documents Received — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>We've received your KYC documents and they're now under review. We'll notify you as soon as a decision is made — usually within 1–2 business days.</p>`),
    );
  }

  async sendInvestmentSubmittedEmail(to: string, clientName: string, productName: string, amountNaira: number) {
    return this.sendEmail(
      to,
      'Investment Submitted — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your investment of <strong>${this.naira(amountNaira)}</strong> in <strong>${productName}</strong> has been submitted and is awaiting approval. Funds have been reserved from your wallet. We'll notify you once it's reviewed.</p>`),
    );
  }

  async sendInvestmentActivatedEmail(to: string, clientName: string, productName: string, amountNaira: number, maturityDate?: Date | null) {
    return this.sendEmail(
      to,
      'Investment Activated — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your investment of <strong>${this.naira(amountNaira)}</strong> in <strong>${productName}</strong> is now active.</p>${maturityDate ? `<p>Maturity date: <strong>${this.date(maturityDate)}</strong>.</p>` : ''}<p>Thank you for investing with Prodigy Finance.</p>`),
    );
  }

  async sendInvestmentRejectedEmail(to: string, clientName: string, productName: string, amountNaira: number, reason?: string) {
    return this.sendEmail(
      to,
      'Investment Not Approved — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your investment of <strong>${this.naira(amountNaira)}</strong> in <strong>${productName}</strong> was not approved.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}<p>The reserved funds have been returned to your wallet. Please contact support if you have questions.</p>`),
    );
  }

  async sendInvestmentMaturingSoonEmail(to: string, clientName: string, productName: string, amountNaira: number, maturityDate: Date, daysLeft: number) {
    return this.sendEmail(
      to,
      `Investment Maturing in ${daysLeft} Day${daysLeft === 1 ? '' : 's'} — Prodigy Finance`,
      this.wrap(`<p>Hi ${clientName},</p><p>Your investment of <strong>${this.naira(amountNaira)}</strong> in <strong>${productName}</strong> is maturing on <strong>${this.date(maturityDate)}</strong> (in ${daysLeft} day${daysLeft === 1 ? '' : 's'}).</p><p>No action is needed — proceeds will be available in your wallet once matured.</p>`),
    );
  }

  async sendInvestmentMaturedEmail(to: string, clientName: string, productName: string, amountNaira: number) {
    return this.sendEmail(
      to,
      'Investment Matured — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your investment of <strong>${this.naira(amountNaira)}</strong> in <strong>${productName}</strong> has matured. Log in to view your statement or reinvest.</p>`),
    );
  }

  async sendWithdrawalRequestedEmail(to: string, clientName: string, amountNaira: number, requiresCoSign: boolean) {
    const body = requiresCoSign
      ? `<p>Hi ${clientName},</p><p>A withdrawal of <strong>${this.naira(amountNaira)}</strong> has been requested on your joint account. Since this account requires both holders to authorize withdrawals, it is now awaiting co-signature from the other account holder before it can be reviewed.</p>`
      : `<p>Hi ${clientName},</p><p>Your withdrawal request of <strong>${this.naira(amountNaira)}</strong> has been submitted and is awaiting review. Funds have been reserved from your wallet.</p>`;
    return this.sendEmail(to, 'Withdrawal Requested — Prodigy Finance', this.wrap(body));
  }

  async sendWithdrawalCoSignNeededEmail(to: string, holderName: string, requestedByName: string, amountNaira: number) {
    return this.sendEmail(
      to,
      'Action Needed: Co-Sign a Withdrawal — Prodigy Finance',
      this.wrap(`<p>Hi ${holderName},</p><p><strong>${requestedByName}</strong> has requested a withdrawal of <strong>${this.naira(amountNaira)}</strong> from your joint account. Your co-signature is required before this can proceed.</p><p>Please log in to review and co-sign or decline this request.</p>`),
    );
  }

  async sendWithdrawalCoSignedEmail(to: string, requesterName: string, amountNaira: number) {
    return this.sendEmail(
      to,
      'Withdrawal Co-Signed — Prodigy Finance',
      this.wrap(`<p>Hi ${requesterName},</p><p>Your withdrawal request of <strong>${this.naira(amountNaira)}</strong> has been co-signed by the other account holder and is now awaiting admin review.</p>`),
    );
  }

  async sendWithdrawalCoSignDeclinedEmail(to: string, requesterName: string, amountNaira: number, reason?: string) {
    return this.sendEmail(
      to,
      'Withdrawal Declined by Co-Signer — Prodigy Finance',
      this.wrap(`<p>Hi ${requesterName},</p><p>Your withdrawal request of <strong>${this.naira(amountNaira)}</strong> was declined by the other account holder.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}<p>The funds have been returned to your wallet.</p>`),
    );
  }

  async sendWithdrawalDisbursedEmail(to: string, clientName: string, amountNaira: number, bankName: string, bankAcctNo: string) {
    return this.sendEmail(
      to,
      'Withdrawal Disbursed — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your withdrawal of <strong>${this.naira(amountNaira)}</strong> has been disbursed to ${bankName} (${bankAcctNo}).</p>`),
    );
  }

  async sendWithdrawalRejectedEmail(to: string, clientName: string, amountNaira: number, reason?: string) {
    return this.sendEmail(
      to,
      'Withdrawal Rejected — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your withdrawal request of <strong>${this.naira(amountNaira)}</strong> was rejected.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}<p>The funds have been returned to your wallet.</p>`),
    );
  }

  async sendWalletFundedEmail(to: string, clientName: string, amountNaira: number) {
    return this.sendEmail(
      to,
      'Wallet Funded — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your wallet has been credited with <strong>${this.naira(amountNaira)}</strong>.</p>`),
    );
  }

  async sendPreTerminationDecisionEmail(to: string, clientName: string, approved: boolean, netPayoutNaira?: number, reason?: string) {
    const subject = approved ? 'Early Exit Approved — Prodigy Finance' : 'Early Exit Request Update — Prodigy Finance';
    const body = approved
      ? `<p>Hi ${clientName},</p><p>Your early exit (pre-termination) request has been approved. Net payout of <strong>${this.naira(netPayoutNaira ?? 0)}</strong> (after early-exit penalty) will be credited to your wallet shortly.</p>`
      : `<p>Hi ${clientName},</p><p>Your early exit (pre-termination) request was not approved.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}`;
    return this.sendEmail(to, subject, this.wrap(body));
  }

  async sendPreTerminationDisbursedEmail(to: string, clientName: string, netPayoutNaira: number) {
    return this.sendEmail(
      to,
      'Early Exit Payout Disbursed — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>Your early exit payout of <strong>${this.naira(netPayoutNaira)}</strong> has been credited to your wallet.</p>`),
    );
  }

  async sendDividendDeclaredEmail(to: string, clientName: string, productName: string, amountNaira: number) {
    return this.sendEmail(
      to,
      'Dividend Credited — Prodigy Finance',
      this.wrap(`<p>Hi ${clientName},</p><p>A dividend of <strong>${this.naira(amountNaira)}</strong> has been declared on your <strong>${productName}</strong> investment.</p>`),
    );
  }

  async sendMandateChangedEmail(to: string, holderName: string, newMandate: 'AND' | 'OR', changedBy: string) {
    return this.sendEmail(
      to,
      'Account Mandate Changed — Prodigy Finance',
      this.wrap(`<p>Hi ${holderName},</p><p>The withdrawal mandate on your joint account has been changed to <strong>${newMandate}</strong> by ${changedBy}.</p><p>${newMandate === 'AND' ? 'Withdrawals now require both holders to authorize.' : 'Either holder may now authorize withdrawals independently.'}</p><p>If you did not expect this change, please contact support immediately.</p>`),
    );
  }

  async sendPasswordChangedEmail(to: string) {
    return this.sendEmail(
      to,
      'Your Password Was Changed — Prodigy Finance',
      this.wrap(`<p>This is a confirmation that your Prodigy Finance password was just changed. If you didn't make this change, please contact support immediately.</p>`),
    );
  }

  async sendSecondaryHolderJoinedEmail(to: string, primaryName: string, secondaryName: string) {
    return this.sendEmail(
      to,
      'Co-Holder Has Set Up Their Access — Prodigy Finance',
      this.wrap(`<p>Hi ${primaryName},</p><p><strong>${secondaryName}</strong> has set up their own login for your joint account and can now access it independently.</p>`),
    );
  }

  /** Broadcast an email to every active admin holding any of the given AdminRole values. Never throws. */
  async notifyAdminsByRole(roles: string[], subject: string, body: string) {
    try {
      const admins = await this.prisma.adminUser.findMany({
        where: { role: { in: roles as any }, status: 'ACTIVE' },
        include: { authUser: { select: { email: true } } },
      });
      await Promise.all(
        admins
          .filter(a => a.authUser?.email)
          .map(a => this.sendEmail(a.authUser!.email, subject, this.wrap(body)).catch(() => {})),
      );
    } catch (err) {
      this.logger.warn(`notifyAdminsByRole failed: ${(err as Error).message}`);
    }
  }

  private naira(amount: number): string {
    return '₦' + Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  private date(d: Date): string {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private wrap(inner: string): string {
    return `<div style="font-family:Arial,sans-serif;color:#0d1b35;line-height:1.6;">${inner}<p style="margin-top:24px;color:#94a3b8;font-size:12px;">Prodigy Finance Team</p></div>`;
  }

}
