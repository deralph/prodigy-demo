import { Controller, Get, Post, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'AUDIT', 'OPERATIONS', 'INVESTMENT')
@Controller('admin/certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('investment/:investmentId')
  @ApiOperation({ summary: 'Generate investment certificate for a specific investment' })
  async generateInvestmentCertificate(
    @Param('investmentId') investmentId: string,
    @Req() req: any,
  ) {
    const admin = { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole };
    return this.certificatesService.generateInvestmentCertificate(investmentId, admin);
  }

  @Get('investment/:investmentId/pdf')
  @ApiOperation({ summary: 'Download investment certificate as PDF' })
  async downloadInvestmentCertificatePdf(
    @Param('investmentId') investmentId: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const admin = { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole };
    const pdfBytes = await this.certificatesService.generateInvestmentCertificatePdf(investmentId, admin);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="investment-certificate-${investmentId}.pdf"`,
      'Content-Length': pdfBytes.length,
    });
    res.send(Buffer.from(pdfBytes));
  }

  @Post('maturity/:investmentId')
  @ApiOperation({ summary: 'Generate maturity certificate for a matured/paid-out investment' })
  async generateMaturityCertificate(
    @Param('investmentId') investmentId: string,
    @Req() req: any,
  ) {
    const admin = { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole };
    return this.certificatesService.generateMaturityCertificate(investmentId, admin);
  }

  @Post('portfolio/:clientId')
  @ApiOperation({ summary: 'Generate portfolio certificate for a client' })
  async generatePortfolioCertificate(
    @Param('clientId') clientId: string,
    @Req() req: any,
  ) {
    const admin = { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole };
    return this.certificatesService.generatePortfolioCertificate(clientId, admin);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get certificate generation history' })
  async getCertificateHistory(
    @Req() req: any,
    @Query() query: { clientId?: string; type?: string; dateFrom?: string; dateTo?: string },
  ) {
    const admin = { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole };
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    return this.certificatesService.getCertificateHistory(admin, { ...query, dateFrom, dateTo });
  }
}