import { UserRole } from '@prisma/client';

export class AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string = 'Bearer';

  constructor(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}

export class AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  mfaEnabled: boolean;
  avatarUrl?: string;

  constructor(partial: Partial<AuthUser>) {
    Object.assign(this, partial);
  }
}

export class JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  iat?: number;
  exp?: number;
}

export class MfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
