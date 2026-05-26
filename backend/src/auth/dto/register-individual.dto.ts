import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
