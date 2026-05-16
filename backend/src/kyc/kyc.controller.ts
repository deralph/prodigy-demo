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
    const s3Url = `https://s3.amazonaws.com/placeholder/${file.originalname}`;
    return this.kycService.uploadDocument(req.user.clientDbId, docKey, file, s3Url);
  }

  @Post('corporate/upload')
  @ApiOperation({ summary: 'Bulk upload all corporate KYC documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadCorporateDocs(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    const filesMap: Record<string, Express.Multer.File> = {};
    const s3Urls: Record<string, string> = {};
    for (const file of files) {
      filesMap[file.fieldname] = file;
      s3Urls[file.fieldname] = `https://s3.amazonaws.com/placeholder/${file.originalname}`;
    }
    return this.kycService.uploadAllDocuments(req.user.clientDbId, filesMap, s3Urls);
  }

  @Post('individual/upload')
  @ApiOperation({ summary: 'Bulk upload all individual/joint KYC documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 12))
  async uploadIndividualDocs(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    const filesMap: Record<string, Express.Multer.File> = {};
    const s3Urls: Record<string, string> = {};
    for (const file of files) {
      filesMap[file.fieldname] = file;
      s3Urls[file.fieldname] = `https://s3.amazonaws.com/placeholder/${file.originalname}`;
    }
    return this.kycService.uploadAllDocuments(req.user.clientDbId, filesMap, s3Urls);
  }

  // ── Admin ────────────────────────────────────────────────────────

  @Get('compliance-board')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: get full KYC compliance board' })
  getComplianceBoard() {
    return this.kycService.getComplianceBoard();
  }

  @Post(':clientId/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: approve KYC for a client' })
  approveKyc(@Param('clientId') clientId: string, @Req() req: any) {
    return this.kycService.approveKyc(clientId, req.user.sub);
  }

  @Post(':clientId/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: reject KYC with reason' })
  rejectKyc(
    @Param('clientId') clientId: string,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    return this.kycService.rejectKyc(clientId, req.user.sub, reason);
  }
}
