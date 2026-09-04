import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';

@ApiTags('Admin — Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles('admin')
@AdminRoles('SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'AUDIT')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List available report types' })
  findAll(@Query() query: { type?: string }) {
    return this.reportsService.findAll(query);
  }

  @Get('generate')
  @ApiOperation({ summary: 'Generate report data (JSON)' })
  generate(@Query() query: { type: string; startDate?: string; endDate?: string; clientId?: string; status?: string }, @Req() req: any) {
    const admin = { adminUserId: req.user?.adminUserId, adminRole: req.user?.adminRole };
    return this.reportsService.generate(query, admin);
  }

  @Get('generate/pdf')
  @ApiOperation({ summary: 'Generate report as PDF download' })
  async generatePdf(@Query() query: { type: string; startDate?: string; endDate?: string; clientId?: string; status?: string }, @Req() req: any, @Res() res: any) {
    const admin = { adminUserId: req.user?.adminUserId, adminRole: req.user?.adminRole };
    const report = await this.reportsService.generate(query, admin);
    const pdfBytes = await this.reportsService.generatePdf(report);

    const filename = `${query.type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBytes.length,
    });
    res.send(Buffer.from(pdfBytes));
  }
}
