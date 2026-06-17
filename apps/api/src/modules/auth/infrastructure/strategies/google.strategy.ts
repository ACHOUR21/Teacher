import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email from Google profile'), undefined);
      return;
    }

    try {
      // Find or create user
      let user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) {
        // Auto-register via SSO — find a tenant from domain
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
            firstName: profile.name?.givenName ?? 'User',
            lastName: profile.name?.familyName ?? '',
            avatarUrl: profile.photos?.[0]?.value,
            role: UserRole.STUDENT,
            tenantId: tenant.id,
            passwordHash: '',
            emailVerified: true,
            isActive: true,
            provider: 'google',
            providerId: profile.id,
          },
        });
      } else if (!user.providerId) {
        // Link Google to existing account
        await this.prisma.user.update({
          where: { id: user.id },
          data: { provider: 'google', providerId: profile.id, emailVerified: true },
        });
      }

      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
