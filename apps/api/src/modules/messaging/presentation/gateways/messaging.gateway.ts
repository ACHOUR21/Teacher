import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { MessagingService } from '../../messaging.service';

interface AuthSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/messaging' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.join(`user:${client.userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.log(`Messaging client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-conversation')
  handleJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { conversationId: string }) {
    client.join(`conv:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string; content: string; type?: string },
  ) {
    if (!client.userId) {return;}
    const message = await this.messagingService.sendMessage(data.conversationId, client.userId, data.content, data.type);
    this.server.to(`conv:${data.conversationId}`).emit('new-message', message);
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { conversationId: string; isTyping: boolean }) {
    client.to(`conv:${data.conversationId}`).emit('user-typing', { userId: client.userId, isTyping: data.isTyping });
  }
}
