"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MicrosoftStrategy = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _passport = require("@nestjs/passport");
var _client = require("@prisma/client");
var _passportAzureAd = require("passport-azure-ad");
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
let MicrosoftStrategy = exports.MicrosoftStrategy = class MicrosoftStrategy extends (0, _passport.PassportStrategy)(_passportAzureAd.OIDCStrategy, 'microsoft') {
  constructor(config, prisma) {
    super({
      identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
      clientID: config.get('MICROSOFT_CLIENT_ID') ?? '',
      clientSecret: config.get('MICROSOFT_CLIENT_SECRET') ?? '',
      responseType: 'code',
      responseMode: 'query',
      redirectUrl: config.get('MICROSOFT_CALLBACK_URL') ?? 'http://localhost:3001/api/v1/auth/microsoft/callback',
      allowHttpForRedirectUrl: true,
      validateIssuer: false,
      passReqToCallback: false,
      scope: ['openid', 'email', 'profile']
    });
    this.config = config;
    this.prisma = prisma;
  }
  async validate(profile, done) {
    const email = profile._json?.email ?? profile.upn;
    if (!email) {
      done(new Error('No email from Microsoft profile'), undefined);
      return;
    }
    try {
      let user = await this.prisma.user.findFirst({
        where: {
          email
        }
      });
      if (!user) {
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
            role: _client.UserRole.STUDENT,
            tenantId: tenant.id,
            passwordHash: '',
            emailVerified: true,
            isActive: true,
            provider: 'microsoft',
            providerId: profile.oid
          }
        });
      } else if (!user.providerId) {
        await this.prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            provider: 'microsoft',
            providerId: profile.oid,
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
exports.MicrosoftStrategy = MicrosoftStrategy = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], MicrosoftStrategy);