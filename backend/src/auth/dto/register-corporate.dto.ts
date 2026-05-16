import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCorporateDto {
  @ApiProperty({ example: 'Prodigy Holdings Ltd' })
  @IsString()
  entityName: string;

  @ApiProperty({ example: 'admin@prodigyholdingsltd.com' })
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
}
