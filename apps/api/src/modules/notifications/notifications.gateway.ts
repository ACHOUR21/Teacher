/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  href?: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

@WebSocketGateway({
  cors: { origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? '*', credentials: true },
  namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify<{ id?: string; sub?: string }>(
        token,
        { secret: process.env['JWT_SECRET'] ?? 'secret' },
      );
      const userId = payload.id ?? payload.sub;
      if (!userId) { client.disconnect(); return; }

      client.data['userId'] = userId;
      // Each user has a personal room for targeted delivery
      await client.join(`user:${userId}`);
      this.logger.debug(`Client connected: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.data?.['userId']}`);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(@ConnectedSocket() client: Socket) {
    const userId = client.data?.['userId'];
    if (userId) {await client.join(`user:${userId}`);}
  }

  /** Emit a real-time notification to a specific user across all their sessions. */
  sendToUser(userId: string, payload: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  /** Emit the current unread count to a specific user so the bell badge stays accurate. */
  sendUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('unread_count', count);
  }
}
