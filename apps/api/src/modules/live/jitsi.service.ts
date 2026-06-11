import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface JitsiTokenParams {
  userId: string;
  displayName: string;
  email: string;
  sessionId: string;
  isModerator: boolean;
}

@Injectable()
export class JitsiService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Generate a Jitsi Meet JWT for a user to join a room.
   * Signs with JITSI_APP_SECRET, expires in 2 hours.
   */
  generateJitsiToken(params: JitsiTokenParams): string {
    const appId = this.config.get<string>('JITSI_APP_ID', 'eduai');
    const appSecret = this.config.get<string>('JITSI_APP_SECRET', 'changeme');
    const domain = this.config.get<string>('JITSI_DOMAIN', 'meet.jit.si');
    const roomName = this.getRoomName(params.sessionId);

    const payload = {
      aud: appId,
      iss: appId,
      sub: domain,
      room: roomName,
      context: {
        user: {
          id: params.userId,
          name: params.displayName,
          email: params.email,
          moderator: params.isModerator,
        },
      },
    };

    return jwt.sign(payload, appSecret, { expiresIn: '2h' });
  }

  /**
   * Derive a deterministic Jitsi room name from the session ID.
   * Strips hyphens so the name is URL-safe.
   */
  getRoomName(sessionId: string): string {
    return `eduai_${sessionId.replace(/-/g, '')}`;
  }

  /**
   * Build the full Jitsi URL a client should open (or embed in an iframe).
   */
  getJitsiUrl(sessionId: string, token: string): string {
    const domain = this.config.get<string>('JITSI_DOMAIN', 'meet.jit.si');
    const roomName = this.getRoomName(sessionId);
    return `https://${domain}/${roomName}?jwt=${token}`;
  }
}
