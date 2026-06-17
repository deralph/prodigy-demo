import { IsArray, IsEmail, IsIn, IsOptional, IsString, Length, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterIndividualHolderIdentityDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '22345678901' })
  @IsString()
  @Length(11, 11)
  bvn: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RegisterIndividualDto {
  @ApiProperty({ enum: ['single', 'joint'], example: 'single' })
  @IsIn(['single', 'joint'])
  accountType: 'single' | 'joint';

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  primaryName: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  secondaryName?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  secondaryEmail?: string;

  @ApiPropertyOptional({ example: '08023456789' })
  @IsOptional()
  @IsString()
  secondaryPhone?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secur3Pass!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '22345678901', description: 'Primary holder BVN used for QoreID account authentication. Raw BVN is never stored.' })
  @IsString()
  @Length(11, 11)
  bvn: string;

  @ApiPropertyOptional({ type: [RegisterIndividualHolderIdentityDto], description: 'BVNs for all holders on joint accounts. Raw BVNs are verified and discarded.' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterIndividualHolderIdentityDto)
  holderIdentities?: RegisterIndividualHolderIdentityDto[];
}
