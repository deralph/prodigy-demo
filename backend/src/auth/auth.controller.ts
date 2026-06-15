import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import { RegisterIndividualDto } from './dto/register-individual.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in — returns access + refresh tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register/corporate')
  @ApiOperation({ summary: 'Register a new corporate entity' })
  registerCorporate(@Body() dto: RegisterCorporateDto) {
    return this.authService.registerCorporate(dto);
  }

  @Post('register/individual')
  @ApiOperation({ summary: 'Register individual or joint account' })
  registerIndividual(@Body() dto: RegisterIndividualDto) {
    return this.authService.registerIndividual(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send OTP for password reset' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Verify OTP and set a new password' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@Req() req: any) {
    return this.authService.getMe(req.user.sub);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Req() req: any) {
    return this.authService.refresh(req.user.sub, req.user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate refresh token' })
  logout(@Req() req: any) {
    return this.authService.logout(req.user.sub);
  }

  @Get('magic-login')
  @ApiOperation({ summary: 'Exchange magic link token for session tokens (joint secondary holder)' })
  magicLogin(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }
}
