import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { ApiKeysService } from './api-keys.service';

/**
 * Guard that validates an API key supplied via:
 *   - Authorization: Bearer eak_...
 *   - X-API-Key: eak_...
 *
 * On success it attaches the validated context to request.apiKeyContext.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown> & {
      headers: Record<string, string | undefined>;
      apiKeyContext?: { userId: string; tenantId: string; scopes: string[] };
    }>();

    const rawKey = this.extractKey(request.headers);

    if (!rawKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validated = await this.apiKeysService.validateApiKey(rawKey);

    if (!validated) {
      throw new UnauthorizedException('Invalid, expired, or revoked API key');
    }

    // Attach to request so controllers/services can read it
    request.apiKeyContext = validated;

    return true;
  }

  private extractKey(headers: Record<string, string | undefined>): string | null {
    // Check X-API-Key header first
    const xApiKey = headers['x-api-key'];
    if (xApiKey) {
      return xApiKey;
    }

    // Check Authorization: Bearer <key>
    const authorization = headers['authorization'];
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      if (token.startsWith('eak_')) {
        return token;
      }
    }

    return null;
  }
}
