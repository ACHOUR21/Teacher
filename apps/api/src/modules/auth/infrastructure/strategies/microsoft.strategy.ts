import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { OIDCStrategy, type IProfile, type VerifyCallback } from 'passport-azure-ad';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(OIDCStrategy, 'microsoft') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      identityMetadata:
        'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
      clientID: config.get<string>('MICROSOFT_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('MICROSOFT_CLIENT_SECRET') ?? '',
      responseType: 'code',
      responseMode: 'query',
      redirectUrl:
        config.get<string>('MICROSOFT_CALLBACK_URL') ??
        'http://localhost:3001/api/v1/auth/microsoft/callback',
      allowHttpForRedirectUrl: true,
      validateIssuer: false,
      passReqToCallback: false,
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(profile: IProfile, done: VerifyCallback): Promise<void> {
    const email =
      (profile._json?.email as string | undefined) ?? profile.upn;
    if (!email) {
      done(new Error('No email from Microsoft profile'), undefined);
      return;
    }

    try {
      let user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) {
        const domain = email.split('@')[1] ?? '';
        const tenant =
          (await this.prisma.tenant.findFirst({
            where: { OR: [{ domain }, { slug: domain.split('.')[0] }] },
          })) ??
          (await this.prisma.tenant.findFirst({ where: { slug: 'demo' } }));

        if (!tenant) {
          done(new Error('No tenant found for this email domain'), undefined);
          return;
        }

        user = await this.prisma.user.create({
          data: {
            email,
            firstName: (profile.name?.givenName as string | undefined) ?? 'User',
            lastName: (profile.name?.familyName as string | undefined) ?? '',
            role: UserRole.STUDENT,
            tenantId: tenant.id,
            passwordHash: '',
            emailVerified: true,
            isActive: true,
            provider: 'microsoft',
            providerId: profile.oid,
          },
        });
      } else if (!user.providerId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'microsoft',
            providerId: profile.oid,
            emailVerified: true,
          },
        });
      }

      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
