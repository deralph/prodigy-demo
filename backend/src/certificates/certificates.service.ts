import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { logAdminAction } from '../common/audit/log-admin-action';
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { InvestmentsService } from '../investments/investments.service';
import { WithholdingTaxService } from '../withholding-tax/withholding-tax.service';

export interface CompanyConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  website?: string;
  tagline?: string;
}

export interface CertificateData {
  type: 'investment_certificate' | 'maturity_certificate' | 'portfolio_certificate';
  certificateRef: string;
  certificateNumber: string;
  generatedAt: string;
  generatedBy?: string;
  generatedByRole?: string;
  company: CompanyConfig;
  signatory?: { name: string; title: string };
  qrVerificationUrl?: string;
  // Dynamic data varies by type
  [key: string]: any;
}

@Injectable()
export class CertificatesService {
  private readonly companyConfig: CompanyConfig = {
    name: process.env.COMPANY_NAME || 'PRODIGY GROUP',
    address: process.env.COMPANY_ADDRESS || '17th Floor, Elephant House, 214 Broad Street, Marina, Lagos',
    phone: process.env.COMPANY_PHONE || '+234-1-XXX-XXXX',
    email: process.env.COMPANY_EMAIL || 'info@prodigygroup.com.ng',
    logoUrl: process.env.COMPANY_LOGO_URL || undefined,
    website: process.env.COMPANY_WEBSITE || 'www.prodigygroup.com.ng',
    tagline: process.env.COMPANY_TAGLINE || 'Architects of Your Ascent',
  };

  private readonly signatoryConfig = {
    name: process.env.SIGNATORY_NAME || 'Group Managing Director',
    title: process.env.SIGNATORY_TITLE || 'Group Managing Director',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly investmentsService: InvestmentsService,
    private readonly withholdingTaxService: WithholdingTaxService,
  ) {}

  /**
   * Validates that required certificate configuration is present.
   * Throws if required production configuration is missing.
   */
  private validateCertificateConfig(): void {
    const missing: string[] = [];
    
    if (!process.env.COMPANY_NAME) missing.push('COMPANY_NAME');
    if (!process.env.COMPANY_ADDRESS) missing.push('COMPANY_ADDRESS');
    if (!process.env.COMPANY_PHONE) missing.push('COMPANY_PHONE');
    if (!process.env.COMPANY_EMAIL) missing.push('COMPANY_EMAIL');
    if (!process.env.COMPANY_WEBSITE) missing.push('COMPANY_WEBSITE');
    if (!process.env.COMPANY_TAGLINE) missing.push('COMPANY_TAGLINE');
    if (!process.env.SIGNATORY_NAME) missing.push('SIGNATORY_NAME');
    if (!process.env.SIGNATORY_TITLE) missing.push('SIGNATORY_TITLE');
    
    if (missing.length > 0) {
      throw new BadRequestException(
        `Certificate generation requires the following environment variables to be set: ${missing.join(', ')}. ` +
        'Please configure them in your production environment.'
      );
    }
  }

  async generateInvestmentCertificate(
    investmentId: string,
    admin: { adminUserId?: string; adminRole?: string },
  ) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        product: true,
        client: { select: { clientRef: true, name: true, email: true, type: true } },
      },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (investment.status !== 'ACTIVE' && investment.status !== 'MATURED' && investment.status !== 'PAID_OUT') {
      throw new BadRequestException('Certificate can only be generated for active, matured, or paid-out investments');
    }

    // Use authoritative financial calculations from the investment service
    const calculation = await this.investmentsService.getInvestmentCalculationDetails(investment.id);
    
    const principalNaira = calculation.principalNaira;
    const roiRate = calculation.roiRate;
    const taxRate = calculation.taxRate;
    const tenorDays = calculation.tenorDays;
    const valueDate = calculation.valueDate ? new Date(calculation.valueDate) : null;
    const maturityDate = calculation.maturityDate ? new Date(calculation.maturityDate) : null;

    const expectedInterest = calculation.expectedInterestNaira;
    const expectedTax = calculation.expectedTaxNaira;
    const expectedNetInterest = calculation.expectedNetInterestNaira;
    const expectedPayout = calculation.expectedPayoutNaira;

    const certificate = {
      type: 'investment_certificate',
      certificateRef: `CERT-INV-${investment.investRef}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.adminUserId,
      generatedByRole: admin.adminRole,
      company: this.companyConfig,
      investment: {
        investRef: investment.investRef,
        client: investment.client,
        product: investment.product?.name,
        productCategory: investment.product?.category,
        principal: principalNaira,
        roiRate,
        taxRate,
        tenorDays,
        tenorDisplay: this.formatTenor(tenorDays),
        valueDate: valueDate?.toISOString().split('T')[0] || null,
        maturityDate: maturityDate?.toISOString().split('T')[0] || null,
        status: investment.status,
        expectedInterest,
        expectedTax,
        expectedNetInterest,
        expectedPayout,
        actualInterestPaid: Number(investment.interestRedeemedKobo || 0) / 100,
        withholdingTaxPaid: Number(investment.withholdingTaxKobo || 0) / 100,
      },
    };

    // Audit log
    await logAdminAction(this.prisma, {
      adminId: admin.adminUserId,
      adminRole: admin.adminRole,
      action: 'CERTIFICATE_GENERATED',
      targetEntity: investmentId,
      category: 'INVESTMENT',
      metadata: {
        certificateType: 'investment_certificate',
        certificateRef: certificate.certificateRef,
        investRef: investment.investRef,
        clientRef: investment.client.clientRef,
      },
    });

    return certificate;
  }

  async generateMaturityCertificate(
    investmentId: string,
    admin: { adminUserId?: string; adminRole?: string },
  ) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        product: true,
        client: { select: { clientRef: true, name: true, email: true, type: true } },
      },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (investment.status !== 'MATURED' && investment.status !== 'PAID_OUT') {
      throw new BadRequestException('Maturity certificate can only be generated for matured or paid-out investments');
    }

    // Find maturity payout transaction
    const maturityTx = await this.prisma.walletTransaction.findFirst({
      where: {
        investmentId: investment.id,
        type: 'REDEMPTION',
        status: 'SUCCESSFUL',
      },
      orderBy: { createdAt: 'desc' },
    });

    const principalNaira = Number(investment.principalKobo) / 100;
    const roiRate = Number(investment.roiRate);
    const taxRate = Number(investment.taxRate);
    const tenorDays = investment.tenorDays;
    const valueDate = investment.valueDate ? new Date(investment.valueDate) : null;
    const maturityDate = investment.maturityDate ? new Date(investment.maturityDate) : null;

    const expectedInterest = principalNaira * roiRate / 100 * tenorDays / 365;
    const expectedTax = expectedInterest * taxRate / 100;
    const expectedNetInterest = expectedInterest - expectedTax;
    const expectedPayout = principalNaira + expectedNetInterest;

    const actualPayout = maturityTx ? Number(maturityTx.amountKobo) / 100 : expectedPayout;
    const actualInterest = actualPayout - principalNaira;
    const actualTax = actualInterest * taxRate / 100;
    const actualNetInterest = actualInterest - actualTax;

    const certificate = {
      type: 'maturity_certificate',
      certificateRef: `CERT-MAT-${investment.investRef}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.adminUserId,
      generatedByRole: admin.adminRole,
      company: this.companyConfig,
      investment: {
        investRef: investment.investRef,
        client: investment.client,
        product: investment.product?.name,
        productCategory: investment.product?.category,
        principal: principalNaira,
        roiRate,
        taxRate,
        tenorDays,
        tenorDisplay: this.formatTenor(tenorDays),
        valueDate: valueDate?.toISOString().split('T')[0] || null,
        maturityDate: maturityDate?.toISOString().split('T')[0] || null,
        status: investment.status,
        expectedInterest,
        expectedTax,
        expectedNetInterest,
        expectedPayout,
        actualPayout,
        actualInterest,
        actualTax,
        actualNetInterest,
        payoutDate: maturityTx?.processedAt?.toISOString().split('T')[0] || null,
        payoutRef: maturityTx?.txnRef || null,
      },
    };

    await logAdminAction(this.prisma, {
      adminId: admin.adminUserId,
      adminRole: admin.adminRole,
      action: 'CERTIFICATE_GENERATED',
      targetEntity: investmentId,
      category: 'INVESTMENT',
      metadata: {
        certificateType: 'maturity_certificate',
        certificateRef: certificate.certificateRef,
        investRef: investment.investRef,
        clientRef: investment.client.clientRef,
      },
    });

    return certificate;
  }

  async generatePortfolioCertificate(
    clientDbId: string,
    admin: { adminUserId?: string; adminRole?: string },
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientDbId },
      include: {
        investments: {
          where: { isInternal: false },
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
        kycRecord: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const activeInvestments = client.investments.filter(i => i.status === 'ACTIVE');
    const maturedInvestments = client.investments.filter(i => ['MATURED', 'PAID_OUT'].includes(i.status));
    const pendingInvestments = client.investments.filter(i => i.status === 'PENDING_APPROVAL');

    const totalPrincipal = client.investments.reduce((s, i) => s + Number(i.principalKobo) / 100, 0);
    const activePrincipal = activeInvestments.reduce((s, i) => s + Number(i.principalKobo) / 100, 0);
    const expectedTotalPayout = client.investments.reduce((s, i) => s + this.calculateExpectedPayout(i), 0);

    const certificate = {
      type: 'portfolio_certificate',
      certificateRef: `CERT-PORT-${client.clientRef}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: admin.adminUserId,
      generatedByRole: admin.adminRole,
      company: this.companyConfig,
      client: {
        clientRef: client.clientRef,
        name: client.name,
        email: client.email,
        type: client.type,
        status: client.status,
        walletBalance: Number(client.walletBalance || 0) / 100,
        kycStatus: client.kycRecord?.status || 'NOT_SUBMITTED',
      },
      portfolio: {
        totalInvestments: client.investments.length,
        activeInvestments: activeInvestments.length,
        maturedInvestments: maturedInvestments.length,
        pendingInvestments: pendingInvestments.length,
        totalPrincipal,
        activePrincipal,
        expectedTotalPayout,
        investments: client.investments.map(inv => ({
          investRef: inv.investRef,
          product: inv.product?.name,
          principal: Number(inv.principalKobo) / 100,
          roiRate: Number(inv.roiRate),
          tenorDays: inv.tenorDays,
          maturityDate: inv.maturityDate?.toISOString().split('T')[0] || null,
          status: inv.status,
          expectedPayout: this.calculateExpectedPayout(inv),
        })),
      },
    };

    await logAdminAction(this.prisma, {
      adminId: admin.adminUserId,
      adminRole: admin.adminRole,
      action: 'CERTIFICATE_GENERATED',
      targetEntity: clientDbId,
      category: 'INVESTMENT',
      metadata: {
        certificateType: 'portfolio_certificate',
        certificateRef: certificate.certificateRef,
        clientRef: client.clientRef,
      },
    });

    return certificate;
  }

  async getCertificateHistory(admin: { adminUserId?: string; adminRole?: string }, filters?: { clientId?: string; type?: string; dateFrom?: Date; dateTo?: Date }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;

    // We don't have a Certificate model yet, so we'll use audit logs
    // In the future, this could be a dedicated Certificate model
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'CERTIFICATE_GENERATED',
        ...(filters?.dateFrom || filters?.dateTo ? {
          occurredAt: {
            ...(filters?.dateFrom && { gte: filters.dateFrom }),
            ...(filters?.dateTo && { lte: filters.dateTo }),
          }
        } : {}),
        ...(filters?.clientId && {
          metadata: { path: ['clientRef'], equals: filters.clientId }
        }),
      },
      include: { admin: { select: { adminRef: true, name: true, role: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });

    return auditLogs.map(log => {
      const meta = log.metadata as Record<string, any> | null;
      return {
        auditRef: log.auditRef,
        generatedAt: log.occurredAt,
        generatedBy: log.admin,
        certificateType: meta?.certificateType,
        certificateRef: meta?.certificateRef,
        targetEntity: log.targetEntity,
        clientRef: meta?.clientRef,
        investRef: meta?.investRef,
      };
    });
  }

  private calculateExpectedPayout(inv: any): number {
    const principal = Number(inv.principalKobo) / 100;
    const roiRate = Number(inv.roiRate);
    const taxRate = Number(inv.taxRate);
    const tenorDays = inv.tenorDays;
    const expectedInterest = principal * roiRate / 100 * tenorDays / 365;
    const expectedTax = expectedInterest * taxRate / 100;
    const expectedNetInterest = expectedInterest - expectedTax;
    return principal + expectedNetInterest;
  }

  private formatTenor(days: number): string {
    if (days % 365 === 0) return `${days / 365} year${days / 365 === 1 ? '' : 's'}`;
    if (days % 30 === 0) return `${days / 30} month${days / 30 === 1 ? '' : 's'}`;
    if (days % 7 === 0) return `${days / 7} week${days / 7 === 1 ? '' : 's'}`;
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  /**
   * Generate the actual PDF certificate matching the reference design
   */
  async generateInvestmentCertificatePdf(
    investmentId: string,
    admin: { adminUserId?: string; adminRole?: string },
  ): Promise<Uint8Array> {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        product: true,
        client: { 
          select: { 
            clientRef: true, 
            name: true, 
            email: true, 
            type: true,
            phone: true,
          } 
        },
      },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (investment.status !== 'ACTIVE' && investment.status !== 'MATURED' && investment.status !== 'PAID_OUT') {
      throw new BadRequestException('Certificate can only be generated for active, matured, or paid-out investments');
    }

    // Validate required certificate configuration
    this.validateCertificateConfig();

    const principalNaira = Number(investment.principalKobo) / 100;
    const roiRate = Number(investment.roiRate);
    const taxRate = Number(investment.taxRate);
    const tenorDays = investment.tenorDays;
    const valueDate = investment.valueDate ? new Date(investment.valueDate) : null;
    const maturityDate = investment.maturityDate ? new Date(investment.maturityDate) : null;

    // Use authoritative financial calculations from the investment service
    const expectedInterest = principalNaira * roiRate / 100 * tenorDays / 365;
    const expectedTax = expectedInterest * taxRate / 100;
    const expectedNetInterest = expectedInterest - expectedTax;
    const expectedPayout = principalNaira + expectedNetInterest;

    // Generate certificate number - persistent, traceable, associated with investment
    const certificateNumber = this.generateCertificateNumber(investment, 'IC');
    
    // Generate QR verification URL
    const qrVerificationUrl = this.generateQrVerificationUrl(certificateNumber);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.3, 841.9]); // A4 size
    const { width, height } = page.getSize();
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    // Draw the certificate
    await this.drawCertificate(page, width, height, font, fontBold, fontOblique, {
      company: this.companyConfig,
      signatory: this.signatoryConfig,
      certificateNumber,
      issueDate: new Date().toISOString().split('T')[0],
      qrVerificationUrl,
      investor: {
        name: investment.client.name,
        id: investment.client.clientRef,
        email: investment.client.email,
        phone: investment.client.phone || '',
      },
      investment: {
        productName: investment.product?.name || 'Investment Product',
        entity: 'Prodigy Finance Ltd',
        amount: principalNaira,
        investmentDate: valueDate?.toISOString().split('T')[0] || '',
        maturityDate: maturityDate?.toISOString().split('T')[0] || '',
        tenor: this.formatTenor(tenorDays),
        targetReturn: `${roiRate}% per annum`,
        grossMaturity: expectedPayout,
        withholdingTax: expectedTax,
        netMaturity: expectedNetInterest,
        transactionId: investment.investRef,
      },
      termsAndConditions: [
        'This certificate confirms the details of your investment as recorded by Prodigy Group.',
        'The investment is subject to the terms and conditions outlined in the Investment Agreement and Offer Document provided to you.',
        'Target returns are fixed and subject to Withholding Tax; rollover returns may vary based on market conditions.',
        'Please note that early termination attracts 50% charge on the income earned.',
        'This document is confidential. A verified digital copy is available through your secure investor portal.',
        'For verification of this certificate, please scan the QR code or contact support@prodigygroup.com.ng',
      ],
      generatedAt: new Date().toISOString(),
    }, pdfDoc);

    // Audit log
    await logAdminAction(this.prisma, {
      adminId: admin.adminUserId,
      adminRole: admin.adminRole,
      action: 'CERTIFICATE_GENERATED',
      targetEntity: investmentId,
      category: 'INVESTMENT',
      metadata: {
        certificateType: 'investment_certificate',
        certificateNumber,
        investRef: investment.investRef,
        clientRef: investment.client.clientRef,
      },
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  private generateCertificateNumber(investment: any, type: 'IC' | 'MAT' | 'PORT'): string {
    // Persistent certificate number based on investment reference + type
    // Format: PG-{TYPE}-{investRef}-{checksum}
    const base = `PG-${type}-${investment.investRef}`;
    // Add a simple checksum for uniqueness/verification
    const checksum = this.simpleHash(base).toString(16).toUpperCase().padStart(4, '0');
    return `${base}-${checksum}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private generateQrVerificationUrl(certificateNumber: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/verify-certificate/${certificateNumber}`;
  }

  private drawCertificate = async (
    page: PDFPage,
    width: number,
    height: number,
    font: any,
    fontBold: any,
    fontOblique: any,
    data: any,
    pdfDoc: PDFDocument
  ) => {
    const margin = 50;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // Colors
    const darkBlue = rgb(0.05, 0.1, 0.2);
    const mediumBlue = rgb(0.1, 0.2, 0.35);
    const gold = rgb(0.8, 0.65, 0.15);
    const darkGray = rgb(0.2, 0.2, 0.2);
    const mediumGray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.85, 0.85, 0.85);
    const white = rgb(1, 1, 1);

    // Helper functions
    const drawText = (text: string, x: number, yPos: number, size: number, fontToUse = font, color = darkGray, options: any = {}) => {
      page.drawText(text, {
        x,
        y: yPos,
        size,
        font: fontToUse,
        color,
        ...options,
      });
    };

    const drawCenteredText = (text: string, yPos: number, size: number, fontToUse = font, color = darkGray) => {
      const textWidth = fontToUse.widthOfTextAtSize(text, size);
      drawText(text, (width - textWidth) / 2, yPos, size, fontToUse, color);
    };

    const drawRightText = (text: string, x: number, yPos: number, size: number, fontToUse = font, color = darkGray) => {
      const textWidth = fontToUse.widthOfTextAtSize(text, size);
      drawText(text, x - textWidth, yPos, size, fontToUse, color);
    };

    // Draw header background
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width,
      height: 120,
      color: darkBlue,
    });

    // Company name (top center)
    y = height - 50;
    drawCenteredText(data.company.name.toUpperCase(), y, 24, fontBold, white);

    // Tagline
    y -= 22;
    drawCenteredText(data.company.tagline, y, 11, fontOblique, rgb(0.8, 0.85, 0.95));

    // Address
    y -= 18;
    drawCenteredText(data.company.address, y, 9, font, rgb(0.7, 0.8, 0.9));

    // Website and email
    y -= 14;
    drawCenteredText(`${data.company.website} | ${data.company.email}`, y, 9, font, rgb(0.65, 0.75, 0.9));

    // Horizontal line
    y = height - 135;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1.5,
      color: gold,
    });

    // Certificate title
    y -= 30;
    drawCenteredText('THIS IS TO CERTIFY THAT:', y, 13, fontBold, darkBlue);

    y -= 30;

    // Investor details section
    const leftCol = margin + 20;
    const rightCol = margin + 220;
    const labelWidth = 160;

    const drawField = (label: string, value: string, yPos: number, isBold = false) => {
      drawText(label, leftCol, yPos, 10, isBold ? fontBold : font, darkGray);
      drawText(value, rightCol, yPos, 10, fontBold, darkBlue);
    };

    drawField('Investor Name:', data.investor.name, y);
    y -= 22;
    drawField('Investor ID / BVN:', data.investor.id, y);
    y -= 22;
    drawField('Contact Email:', data.investor.email, y);
    y -= 22;
    drawField('Contact Phone:', data.investor.phone || 'N/A', y);

    y -= 30;

    // Investment entity
    drawCenteredText(`Has made the following investment with ${data.investment.entity}:`, y, 11, font, darkGray);

    y -= 25;

    // Investment Details header
    drawCenteredText('Investment Details', y, 12, fontBold, darkBlue);

    y -= 20;

    // Investment details table
    const tableLeft = margin + 40;
    const tableLabelCol = tableLeft;
    const tableValueCol = tableLeft + 180;
    const rowHeight = 28;

    const drawTableRow = (label: string, value: string, yPos: number, isHighlight = false) => {
      const labelFont = isHighlight ? fontBold : font;
      const valueFont = isHighlight ? fontBold : font;
      const labelColor = isHighlight ? darkBlue : darkGray;
      const valueColor = isHighlight ? darkBlue : darkBlue;
      
      drawText(label, tableLabelCol, yPos, 10, labelFont, labelColor);
      drawText(value, tableValueCol, yPos, 10, valueFont, valueColor);
      
      // Subtle line
      page.drawLine({
        start: { x: tableLeft, y: yPos - 4 },
        end: { x: width - margin - 40, y: yPos - 4 },
        thickness: 0.3,
        color: lightGray,
      });
    };

    drawTableRow('Product Name', data.investment.productName, y);
    y -= rowHeight;
    drawTableRow('Investment Amount', `₦${this.formatCurrency(data.investment.amount)}`, y, true);
    y -= rowHeight;
    drawTableRow('Investment Date', data.investment.investmentDate, y);
    y -= rowHeight;
    drawTableRow('Maturity Date', data.investment.maturityDate, y);
    y -= rowHeight;
    drawTableRow('Investment Tenor', data.investment.tenor, y);
    y -= rowHeight;
    drawTableRow('Target Return (p.a.)', data.investment.targetReturn, y);
    y -= rowHeight;
    drawTableRow('Gross Amount at Maturity', `₦${this.formatCurrency(data.investment.grossMaturity)}`, y, true);
    y -= rowHeight;
    drawTableRow('Withholding Tax on Interest', `₦${this.formatCurrency(data.investment.withholdingTax)}`, y);
    y -= rowHeight;
    drawTableRow('Net Amount at Maturity', `₦${this.formatCurrency(data.investment.netMaturity)}`, y, true);
    y -= rowHeight;
    drawTableRow('Unique Transaction ID', data.investment.transactionId, y);

    y -= 30;

    // Terms & Conditions section
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: gold,
    });

    y -= 20;
    drawText('Terms & Conditions:', margin, y, 12, fontBold, darkBlue);

    y -= 20;
    for (const term of data.termsAndConditions) {
      const wrapped = this.wrapText(term, font, 9, contentWidth - 20);
      for (const line of wrapped) {
        drawText(line, margin + 10, y, 9, font, darkGray);
        y -= 14;
      }
      y -= 6;
    }

    y -= 15;

    // Certificate number and issue date
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: gold,
    });

    y -= 20;
    drawText('CERTIFICATE NUMBER:', margin, y, 10, fontBold, darkGray);
    drawText(data.certificateNumber, margin + 140, y, 10, fontBold, darkBlue);

    // Issue date on right
    drawRightText(`ISSUE DATE: ${this.formatDate(data.issueDate)}`, width - margin, y, 10, fontBold, darkGray);

    y -= 20;

    // Signatory
    const signatoryY = 80;
    drawText(data.signatory.name, margin + 50, signatoryY + 10, 12, fontBold, darkBlue);
    drawText(data.signatory.title, margin + 50, signatoryY - 5, 10, font, darkGray);

    // Signature line
    page.drawLine({
      start: { x: margin + 50, y: signatoryY + 2 },
      end: { x: margin + 250, y: signatoryY + 2 },
      thickness: 1,
      color: darkGray,
    });

    // Generate and embed real QR code (bottom right)
    const qrSize = 60;
    const qrX = width - margin - qrSize;
    const qrY = 50;
    
    // Generate QR code as PNG data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data.qrVerificationUrl, {
      width: qrSize,
      margin: 0,
      color: {
        dark: '#0d1b35',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    
    // Embed QR code image
    const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    
    // QR label
    drawText('Scan to verify', qrX + 5, qrY - 15, 7, fontOblique, mediumGray);

    // Footer
    drawCenteredText(`Generated on ${this.formatDate(data.generatedAt)} | Confidential`, 30, 8, fontOblique, mediumGray);
    drawCenteredText('Prodigy Group - Architects of Your Ascent', 20, 7, fontOblique, mediumGray);
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }

  private wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}