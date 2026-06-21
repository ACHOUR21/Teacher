"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GoogleStrategy = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _passport = require("@nestjs/passport");
var _client = require("@prisma/client");
var _passportGoogleOauth = require("passport-google-oauth20");
var _prisma = require("../../../database/prisma.service");
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
let GoogleStrategy = exports.GoogleStrategy = class GoogleStrategy extends (0, _passport.PassportStrategy)(_passportGoogleOauth.Strategy, 'google') {
  constructor(config, prisma) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: config.get('GOOGLE_CALLBACK_URL') ?? 'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['email', 'profile']
    });
    this.config = config;
    this.prisma = prisma;
  }
  async validate(_accessToken, _refreshToken, profile, done) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email from Google profile'), undefined);
      return;
    }
    try {
      // Find or create user
      let user = await this.prisma.user.findFirst({
        where: {
          email
        }
      });
      if (!user) {
        // Auto-register via SSO — find a tenant from domain
        const domain = email.split('@')[1] ?? '';
        const tenant = (await this.prisma.tenant.findFirst({
          where: {
            OR: [{
              domain
            }, {
              slug: domain.split('.')[0]
            }]
          }
        })) ?? (await this.prisma.tenant.findFirst({
          where: {
            slug: 'demo'
          }
        }));
        if (!tenant) {
          done(new Error('No tenant found for this email domain'), undefined);
          return;
        }
        user = await this.prisma.user.create({
          data: {
            email,
            firstName: profile.name?.givenName ?? 'User',
            lastName: profile.name?.familyName ?? '',
            avatarUrl: profile.photos?.[0]?.value,
            role: _client.UserRole.STUDENT,
            tenantId: tenant.id,
            passwordHash: '',
            emailVerified: true,
            isActive: true,
            provider: 'google',
            providerId: profile.id
          }
        });
      } else if (!user.providerId) {
        // Link Google to existing account
        await this.prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            provider: 'google',
            providerId: profile.id,
            emailVerified: true
          }
        });
      }
      done(null, user);
    } catch (err) {
      done(err, undefined);
    }
  }
};
exports.GoogleStrategy = GoogleStrategy = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], GoogleStrategy);