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

  async sendWelcomeEmail(to: string, name: string, clientRef: string, accountType: 'individual' | 'joint' | 'corporate') {
    const typeLabel = accountType === 'corporate' ? 'corporate' : accountType;
    return this.sendEmail(
      to,
      'Welcome to Prodigy Finance',
      this.wrap(`<p>Dear ${name},</p><p>Your ${typeLabel} account has been created on Prodigy Finance. Your Client ID is <strong>${clientRef}</strong>.</p><p>Please log in and complete your KYC to activate your account and start investing.</p><p>Best regards,<br/>Prodigy Finance Team</p>`),
    );
  }

  async sendKycSubmissionReminder(to: string, name: string, clientRef: string, daysSinceRegistration: number) {
    return this.sendEmail(
      to,
      'Complete Your KYC to Activate Your Account — Prodigy Finance',
      this.wrap(`<p>Hi ${name},</p><p>It's been ${daysSinceRegistration} day${daysSinceRegistration === 1 ? '' : 's'} since you created your Prodigy Finance account (${clientRef}).</p><p>To start investing, you need to complete your KYC verification. Please log in and upload the required documents.</p><p><a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/kyc" style="background:#0d1b35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Complete KYC Now</a></p><p>If you need help, contact our support team.</p>`),
    );
  }

  async sendWelcomeActiveAccount(to: string, name: string, clientRef: string) {
    return this.sendEmail(
      to,
      'Your Account is Now Active — Prodigy Finance',
      this.wrap(`<p>Hi ${name},</p><p>Great news! Your KYC has been approved and your Prodigy Finance account (<strong>${clientRef}</strong>) is now <strong>active</strong>.</p><p>You can now:</p><ul><li>Fund your wallet</li><li>Browse investment products</li><li>Make your first investment</li></ul><p><a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/dashboard" style="background:#0d1b35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Dashboard</a></p><p>Welcome to Prodigy Finance — we're excited to help you grow your wealth.</p>`),
    );
  }

  async sendFirstInvestmentGuidance(to: string, name: string, clientRef: string) {
    return this.sendEmail(
      to,
      'Ready to Make Your First Investment? — Prodigy Finance',
      this.wrap(`<p>Hi ${name},</p><p>Your account (<strong>${clientRef}</strong>) is active and ready for investing. If you haven't made your first investment yet, here's how to get started:</p><ol><li>Fund your wallet via bank transfer or card</li><li>Browse our investment products (Fixed Income, Money Market, etc.)</li><li>Choose a product that matches your goals and risk appetite</li><li>Invest with as little as ₦10,000</li></ol><p><a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/investments" style="background:#0d1b35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Explore Products</a></p><p>Need help choosing? Our investment team is here to assist.</p>`),
    );
  }

  async sendWalletFundingReminder(to: string, name: string, clientRef: string) {
    return this.sendEmail(
      to,
      'Fund Your Wallet to Start Investing — Prodigy Finance',
      this.wrap(`<p>Hi ${name},</p><p>Your Prodigy Finance account (<strong>${clientRef}</strong>) is active, but your wallet balance is currently zero.</p><p>To invest, you'll need to fund your wallet first. You can do this via:</p><ul><li>Bank transfer (using your unique virtual account)</li><li>Card payment (instant)</li></ul><p><a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/wallet/fund" style="background:#0d1b35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Fund Wallet Now</a></p><p>Once funded, you can start investing immediately.</p>`),
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
