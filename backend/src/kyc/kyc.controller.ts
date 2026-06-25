import {
  Controller, Get, Post, Param, UseGuards, Req,
  UseInterceptors, UploadedFile, UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { uploadToCloudinary } from '../common/cloudinary.provider';

// Admin sub-roles permitted to view and action KYC documents (which contain
// sensitive PII). Mirrors the frontend's ADMIN_PERMISSIONS 'kyc' grant —
// FINANCE, AUDIT, and INVESTMENT admins should not be able to pull a
// client's raw identity documents.
const KYC_ADMIN_ROLES = ['SUPER_ADMIN', 'OPERATIONS', 'COMPLIANCE'];

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own KYC status and document list' })
  getMyKyc(@Req() req: any) {
    return this.kycService.getMyKyc(req.user.clientDbId);
  }

  @Post('documents/:key')
  @ApiOperation({ summary: 'Upload a single KYC document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: any,
    @Param('key') docKey: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { url } = await uploadToCloudinary(file, `prodigy-kyc/${req.user.clientDbId}`);
    return this.kycService.uploadDocument(req.user.clientDbId, docKey, file, url);
  }

  @Post('corporate/upload')
  @ApiOperation({ summary: 'Bulk upload all corporate KYC documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadCorporateDocs(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    const filesMap: Record<string, Express.Multer.File> = {};
    const cloudUrls: Record<string, string> = {};
    for (const file of files) {
      filesMap[file.fieldname] = file;
      const { url } = await uploadToCloudinary(file, `prodigy-kyc/${req.user.clientDbId}`);
      cloudUrls[file.fieldname] = url;
    }
    return this.kycService.uploadAllDocuments(req.user.clientDbId, filesMap, cloudUrls);
  }

  @Post('individual/upload')
  @ApiOperation({ summary: 'Bulk upload all individual/joint KYC documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 12))
  async uploadIndividualDocs(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    const filesMap: Record<string, Express.Multer.File> = {};
    const cloudUrls: Record<string, string> = {};
    for (const file of files) {
      filesMap[file.fieldname] = file;
      const { url } = await uploadToCloudinary(file, `prodigy-kyc/${req.user.clientDbId}`);
      cloudUrls[file.fieldname] = url;
    }
    return this.kycService.uploadAllDocuments(req.user.clientDbId, filesMap, cloudUrls);
  }

  // ── Admin ────────────────────────────────────────────────────────

  @Get('client/:clientId')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles(...KYC_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: get KYC for a specific client' })
  getClientKyc(@Param('clientId') clientId: string, @Req() req: any) {
    return this.kycService.getClientKycForAdmin(clientId, { adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Get('compliance-board')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles(...KYC_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: get full KYC compliance board' })
  getComplianceBoard(@Req() req: any) {
    return this.kycService.getComplianceBoardForAdmin({ adminUserId: req.user.adminUserId, adminRole: req.user.adminRole });
  }

  @Post(':clientId/approve')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles(...KYC_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: approve KYC for a client' })
  approveKyc(@Param('clientId') clientId: string, @Req() req: any) {
    return this.kycService.approveKyc(clientId, req.user.sub);
  }

  @Post(':clientId/reject')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles(...KYC_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: reject KYC with reason' })
  rejectKyc(
    @Param('clientId') clientId: string,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    return this.kycService.rejectKyc(clientId, req.user.sub, reason);
  }

  @Post('documents/:clientId/:docKey/approve')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles(...KYC_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: approve a single KYC document' })
  approveDocument(
    @Param('clientId') clientId: string,
    @Param('docKey') docKey: string,
    @Req() req: any,
  ) {
    return this.kycService.approveDocument(clientId, docKey, req.user.sub);
  }

  @Post('documents/:clientId/:docKey/reject')
  @UseGuards(RolesGuard, AdminRolesGuard)
  @Roles('admin')
  @AdminRoles(...KYC_ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: reject a single KYC document with reason' })
  rejectDocument(
    @Param('clientId') clientId: string,
    @Param('docKey') docKey: string,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    return this.kycService.rejectDocument(clientId, docKey, req.user.sub, reason);
  }
}
