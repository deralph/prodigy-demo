import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NibssService, VerificationResult } from './nibss.service';

class VerifyNinDto {
  nin: string;
  expectedName: string;
}

class VerifyBvnDto {
  bvn: string;
  expectedName: string;
}

class VerifyCacDto {
  cacNumber: string;
  companyName: string;
}

@ApiTags('NIBSS Verification')
@Controller('nibss')
export class NibssController {
  constructor(private nibssService: NibssService) {}

  @Post('verify/nin')
  @ApiOperation({ summary: 'Verify NIN (National Identity Number)' })
  verifyNin(@Body() dto: VerifyNinDto): Promise<VerificationResult> {
    return this.nibssService.verifyNin(dto.nin, dto.expectedName);
  }

  @Post('verify/bvn')
  @ApiOperation({ summary: 'Verify BVN (Bank Verification Number)' })
  verifyBvn(@Body() dto: VerifyBvnDto): Promise<VerificationResult> {
    return this.nibssService.verifyBvn(dto.bvn, dto.expectedName);
  }

  @Post('verify/cac')
  @ApiOperation({ summary: 'Verify CAC (Corporate Affairs Commission) number' })
  verifyCac(@Body() dto: VerifyCacDto): Promise<VerificationResult> {
    return this.nibssService.verifyCac(dto.cacNumber, dto.companyName);
  }
}
