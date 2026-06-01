import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { NibssService, VerificationResult } from './nibss.service';

class VerifyNinDto {
  @ApiProperty({ example: '12345678901' })
  @IsString() @IsNotEmpty()
  nin: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString() @MinLength(2)
  expectedName: string;
}

class VerifyBvnDto {
  @ApiProperty({ example: '22345678901' })
  @IsString() @IsNotEmpty()
  bvn: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString() @MinLength(2)
  expectedName: string;

  @ApiProperty({ example: 'jane@example.com', required: false })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiProperty({ example: '08012345678', required: false })
  @IsOptional() @IsString()
  phone?: string;
}

class VerifyCacDto {
  @ApiProperty({ example: 'RC123456' })
  @IsString() @IsNotEmpty()
  cacNumber: string;

  @ApiProperty({ example: 'Prodigy Holdings Ltd' })
  @IsString() @MinLength(2)
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
    return this.nibssService.verifyBvn(dto.bvn, dto.expectedName, { email: dto.email, phone: dto.phone });
  }

  @Post('verify/cac')
  @ApiOperation({ summary: 'Verify CAC (Corporate Affairs Commission) number' })
  verifyCac(@Body() dto: VerifyCacDto): Promise<VerificationResult> {
    return this.nibssService.verifyCac(dto.cacNumber, dto.companyName);
  }
}
