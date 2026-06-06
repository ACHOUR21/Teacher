import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  Ip,
  Headers,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from '../../auth.service';
import { RegisterDto, CreateTenantRegisterDto } from '../../application/dtos/register.dto';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../../application/dtos/login.dto';
import { RefreshTokenDto } from '../../application/dtos/refresh-token.dto';
import { VerifyMfaDto, DisableMfaDto } from '../../application/dtos/verify-mfa.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { Public } from '../../../core/decorators/public.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { Request as ExpressRequest } from 'express';
import { TenantsService } from '../../../tenants/tenants.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Public()
  @Post('tenant/register')
  @ApiOperation({ summary: 'Create new tenant and admin account' })
  @ApiResponse({ status: 201, description: 'Tenant and admin created successfully' })
  async createTenant(
    @Body() dto: CreateTenantRegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.createTenantAndAdmin({
      tenantName: dto.tenantName,
      tenantSlug: dto.tenantSlug,
      tenantType: dto.tenantType ?? 'SCHOOL',
      adminFirstName: dto.firstName,
      adminLastName: dto.lastName,
      adminEmail: dto.email,
      adminPassword: dto.password,
      adminPhone: dto.phone,
      ipAddress: ip,
      userAgent,
    });
  }

  @Public()
  @Get('tenant/lookup')
  @ApiOperation({ summary: 'Look up a tenant by slug (for student join flow)' })
  @ApiResponse({ status: 200, description: 'Tenant public info' })
  async lookupTenant(@Query('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user in an existing tenant' })
  async register(
    @Body() dto: RegisterDto,
    @TenantId() tenantId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.register({
      tenantId,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      ipAddress: ip,
      userAgent,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @TenantId() tenantId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login({
      email: dto.email,
      password: dto.password,
      tenantId,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      ipAddress: ip,
      userAgent,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Request() req: ExpressRequest & { body: { refreshToken?: string } },
  ) {
    await this.authService.logout(user.id, req.body.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialize MFA setup, returns QR code' })
  async setupMfa(@CurrentUser('id') userId: string) {
    return this.authService.setupMfa(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify TOTP token to enable MFA' })
  async verifyMfa(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyMfaDto,
  ) {
    await this.authService.verifyAndEnableMfa(userId, dto.token);
    return { message: 'MFA enabled successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Disable MFA for current user' })
  async disableMfa(
    @CurrentUser('id') userId: string,
    @Body() dto: DisableMfaDto,
  ) {
    await this.authService.disableMfa(userId, dto.token, dto.password);
    return { message: 'MFA disabled successfully' };
  }

  @Public()
  @Post('mfa/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete MFA challenge after login' })
  async mfaChallenge(@Body() body: { challengeToken: string; token: string }) {
    return this.authService.verifyMfaLogin(body.challengeToken, body.token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @TenantId() tenantId: string,
  ) {
    await this.authService.forgotPassword(dto.email, tenantId);
    return { message: 'If an account exists with this email, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    return { message: 'Password changed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resend email verification link' })
  async sendVerification(@CurrentUser('id') userId: string) {
    await this.authService.sendVerificationEmail(userId);
    return { message: 'Verification email sent' };
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
