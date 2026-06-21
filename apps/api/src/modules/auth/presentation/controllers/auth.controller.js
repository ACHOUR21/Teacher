"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuthController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _passport = require("@nestjs/passport");
var _express = require("express");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _public = require("../../../core/decorators/public.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _tenants = require("../../../tenants/tenants.service");
var _login = require("../../application/dtos/login.dto");
var _refreshToken = require("../../application/dtos/refresh-token.dto");
var _register = require("../../application/dtos/register.dto");
var _verifyMfa = require("../../application/dtos/verify-mfa.dto");
var _auth = require("../../auth.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
let AuthController = exports.AuthController = class AuthController {
  constructor(authService, tenantsService) {
    this.authService = authService;
    this.tenantsService = tenantsService;
  }
  async createTenant(dto, ip, userAgent) {
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
      userAgent
    });
  }
  async lookupTenant(slug) {
    return this.tenantsService.findBySlug(slug);
  }
  async register(dto, tenantId, ip, userAgent) {
    return this.authService.register({
      tenantId,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      ipAddress: ip,
      userAgent
    });
  }
  async login(dto, tenantId, ip, userAgent) {
    return this.authService.login({
      email: dto.email,
      password: dto.password,
      tenantId,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      ipAddress: ip,
      userAgent
    });
  }
  async refresh(dto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }
  async logout(user, req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    await this.authService.logout(user.id, req.body.refreshToken);
    return {
      message: 'Logged out successfully'
    };
  }
  me(user) {
    return user;
  }
  // ── MFA ────────────────────────────────────────────────────────────────────
  async setupMfa(userId) {
    return this.authService.setupMfa(userId);
  }
  async verifyMfa(userId, dto) {
    return this.authService.verifyAndEnableMfa(userId, dto.token);
  }
  async disableMfa(userId, dto) {
    await this.authService.disableMfa(userId, dto.token, dto.password);
    return {
      message: 'MFA disabled successfully'
    };
  }
  async mfaChallenge(body) {
    return this.authService.verifyMfaLogin(body.challengeToken, body.code, {
      trustDevice: body.trustDevice,
      deviceId: body.deviceId,
      deviceName: body.deviceName
    });
  }
  async regenerateBackupCodes(userId, body) {
    return this.authService.regenerateBackupCodes(userId, body.password);
  }
  // ── Devices ────────────────────────────────────────────────────────────────
  async listDevices(userId) {
    return this.authService.getUserDevices(userId);
  }
  async revokeTrust(userId, deviceId) {
    await this.authService.revokeTrustedDevice(userId, deviceId);
    return {
      message: 'Device trust revoked'
    };
  }
  // ── Password & Email ───────────────────────────────────────────────────────
  async forgotPassword(dto, tenantId) {
    await this.authService.forgotPassword(dto.email, tenantId);
    return {
      message: 'If an account exists with this email, a reset link has been sent'
    };
  }
  async resetPassword(dto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      message: 'Password reset successfully'
    };
  }
  async changePassword(userId, body) {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    return {
      message: 'Password changed successfully'
    };
  }
  async sendVerification(userId) {
    await this.authService.sendVerificationEmail(userId);
    return {
      message: 'Verification email sent'
    };
  }
  async verifyEmail(token) {
    return this.authService.verifyEmail(token);
  }
  // ── SSO ────────────────────────────────────────────────────────────────────
  googleAuth() {
    // Passport redirects automatically
  }
  async googleCallback(req, res) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const tokens = await this.authService.generateTokensForUser(req.user);
    const redirectUrl = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/auth/sso-callback?token=${tokens.accessToken}`;
    res.redirect(redirectUrl);
  }
  microsoftAuth() {
    // Passport redirects automatically
  }
  async microsoftCallback(req, res) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const tokens = await this.authService.generateTokensForUser(req.user);
    const redirectUrl = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/auth/sso-callback?token=${tokens.accessToken}`;
    res.redirect(redirectUrl);
  }
};
__decorate([(0, _public.Public)(), (0, _common.Post)('tenant/register'), (0, _swagger.ApiOperation)({
  summary: 'Create new tenant and admin account'
}), (0, _swagger.ApiResponse)({
  status: 201,
  description: 'Tenant and admin created successfully'
}), __param(0, (0, _common.Body)()), __param(1, (0, _common.Ip)()), __param(2, (0, _common.Headers)('user-agent')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _register.CreateTenantRegisterDto !== "undefined" && _register.CreateTenantRegisterDto) === "function" ? _a : Object, String, String]), __metadata("design:returntype", Promise)], AuthController.prototype, "createTenant", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('tenant/lookup'), (0, _swagger.ApiOperation)({
  summary: 'Look up a tenant by slug (for student join flow)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'Tenant public info'
}), __param(0, (0, _common.Query)('slug')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], AuthController.prototype, "lookupTenant", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('register'), (0, _common.HttpCode)(_common.HttpStatus.CREATED), (0, _swagger.ApiOperation)({
  summary: 'Register a new user in an existing tenant'
}), __param(0, (0, _common.Body)()), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Ip)()), __param(3, (0, _common.Headers)('user-agent')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _register.RegisterDto !== "undefined" && _register.RegisterDto) === "function" ? _b : Object, String, String, String]), __metadata("design:returntype", Promise)], AuthController.prototype, "register", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('login'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Login with email and password'
}), __param(0, (0, _common.Body)()), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Ip)()), __param(3, (0, _common.Headers)('user-agent')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _login.LoginDto !== "undefined" && _login.LoginDto) === "function" ? _c : Object, String, String, String]), __metadata("design:returntype", Promise)], AuthController.prototype, "login", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('refresh'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Refresh access token'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_d = typeof _refreshToken.RefreshTokenDto !== "undefined" && _refreshToken.RefreshTokenDto) === "function" ? _d : Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "refresh", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('logout'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Logout and invalidate refresh tokens'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object, Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "logout", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Get)('me'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Get current authenticated user'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_g = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _g : Object]), __metadata("design:returntype", void 0)], AuthController.prototype, "me", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('mfa/setup'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Initialize MFA setup, returns QR code and backup codes'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], AuthController.prototype, "setupMfa", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('mfa/verify'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Verify TOTP token to enable MFA; returns final backup codes'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_h = typeof _verifyMfa.VerifyMfaDto !== "undefined" && _verifyMfa.VerifyMfaDto) === "function" ? _h : Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "verifyMfa", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('mfa/disable'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Disable MFA for current user'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_j = typeof _verifyMfa.DisableMfaDto !== "undefined" && _verifyMfa.DisableMfaDto) === "function" ? _j : Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "disableMfa", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('mfa/challenge'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Complete MFA challenge after login (TOTP or backup code)'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "mfaChallenge", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('mfa/backup-codes/regenerate'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Regenerate MFA backup codes (invalidates old codes)'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "regenerateBackupCodes", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Get)('devices'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'List all devices for the current user'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], AuthController.prototype, "listDevices", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Delete)('devices/:deviceId/trust'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Revoke MFA trust for a device'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Param)('deviceId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", Promise)], AuthController.prototype, "revokeTrust", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('forgot-password'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Request password reset email'
}), __param(0, (0, _common.Body)()), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_k = typeof _login.ForgotPasswordDto !== "undefined" && _login.ForgotPasswordDto) === "function" ? _k : Object, String]), __metadata("design:returntype", Promise)], AuthController.prototype, "forgotPassword", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('reset-password'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Reset password with token'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_l = typeof _login.ResetPasswordDto !== "undefined" && _login.ResetPasswordDto) === "function" ? _l : Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "resetPassword", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('change-password'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Change password for authenticated user'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "changePassword", null);
__decorate([(0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Post)('send-verification'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _swagger.ApiOperation)({
  summary: 'Resend email verification link'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], AuthController.prototype, "sendVerification", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('verify-email'), (0, _swagger.ApiOperation)({
  summary: 'Verify email address with token'
}), __param(0, (0, _common.Query)('token')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], AuthController.prototype, "verifyEmail", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('google'), (0, _common.UseGuards)((0, _passport.AuthGuard)('google')), (0, _swagger.ApiOperation)({
  summary: 'Initiate Google OAuth login'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], AuthController.prototype, "googleAuth", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('google/callback'), (0, _common.UseGuards)((0, _passport.AuthGuard)('google')), (0, _swagger.ApiOperation)({
  summary: 'Google OAuth callback'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, typeof (_o = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _o : Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "googleCallback", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('microsoft'), (0, _common.UseGuards)((0, _passport.AuthGuard)('microsoft')), (0, _swagger.ApiOperation)({
  summary: 'Initiate Microsoft OAuth login'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], AuthController.prototype, "microsoftAuth", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('microsoft/callback'), (0, _common.UseGuards)((0, _passport.AuthGuard)('microsoft')), (0, _swagger.ApiOperation)({
  summary: 'Microsoft OAuth callback'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, typeof (_q = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _q : Object]), __metadata("design:returntype", Promise)], AuthController.prototype, "microsoftCallback", null);
exports.AuthController = AuthController = __decorate([(0, _swagger.ApiTags)('Auth'), (0, _common.Controller)('auth'), __param(0, (0, _common.Inject)(_auth.AuthService)), __param(1, (0, _common.Inject)(_tenants.TenantsService)), __metadata("design:paramtypes", [Object, Object])], AuthController);