import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { LiveService } from '../../live.service';

interface LiveClient extends Socket {
  userId?: string;
  sessionId?: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/live' })
export class LiveGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly liveService: LiveService,
  ) {}

  afterInit() {
    this.logger.log('Live WebSocket Gateway initialized');
  }

  async handleConnection(client: LiveClient) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: LiveClient) {
    if (client.sessionId && client.userId) {
      await this.liveService.leaveSession(client.sessionId, client.userId);
      client.to(client.sessionId).emit('participant-left', { userId: client.userId });
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string },
  ) {
    if (!client.userId) {return { error: 'Unauthorized' };}
    await client.join(data.sessionId);
    client.sessionId = data.sessionId;
    await this.liveService.joinSession(data.sessionId, client.userId);
    const participants = await this.liveService.getParticipants(data.sessionId);
    client.to(data.sessionId).emit('participant-joined', {
      userId: client.userId,
      socketId: client.id,
    });
    return { success: true, participants };
  }

  @SubscribeMessage('leave-session')
  async handleLeaveSession(@ConnectedSocket() client: LiveClient) {
    if (client.sessionId && client.userId) {
      await client.leave(client.sessionId);
      await this.liveService.leaveSession(client.sessionId, client.userId);
      client.to(client.sessionId).emit('participant-left', { userId: client.userId });
      client.sessionId = undefined;
    }
    return { success: true };
  }

  @SubscribeMessage('toggle-camera')
  handleToggleCamera(@ConnectedSocket() client: LiveClient, @MessageBody() data: { enabled: boolean }) {
    if (client.sessionId) {
      client.to(client.sessionId).emit('camera-toggled', { userId: client.userId, enabled: data.enabled });
    }
  }

  @SubscribeMessage('toggle-mic')
  handleToggleMic(@ConnectedSocket() client: LiveClient, @MessageBody() data: { enabled: boolean }) {
    if (client.sessionId) {
      client.to(client.sessionId).emit('mic-toggled', { userId: client.userId, enabled: data.enabled });
    }
  }

  @SubscribeMessage('raise-hand')
  handleRaiseHand(@ConnectedSocket() client: LiveClient, @MessageBody() data: { raised: boolean }) {
    if (client.sessionId) {
      client.to(client.sessionId).emit('hand-raised', { userId: client.userId, raised: data.raised });
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(@ConnectedSocket() client: LiveClient, @MessageBody() data: { message: string }) {
    if (client.sessionId) {
      this.server.to(client.sessionId).emit('new-message', {
        userId: client.userId,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('whiteboard-draw')
  handleWhiteboardDraw(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { type: 'stroke' | 'clear'; [key: string]: unknown },
  ) {
    if (client.sessionId) {
      // Broadcast to all room members including sender for clear events
      const emit = data.type === 'clear'
        ? this.server.to(client.sessionId)
        : client.to(client.sessionId);
      emit.emit('whiteboard-update', { userId: client.userId, data });
    }
  }

  @SubscribeMessage('screen-share')
  handleScreenShare(@ConnectedSocket() client: LiveClient, @MessageBody() data: { sharing: boolean }) {
    if (client.sessionId) {
      this.server.to(client.sessionId).emit('screen-share-changed', {
        userId: client.userId,
        sharing: data.sharing,
      });
    }
  }

  @SubscribeMessage('webrtc-offer')
  handleOffer(@ConnectedSocket() client: LiveClient, @MessageBody() data: { targetId: string; offer: unknown }) {
    this.server.to(data.targetId).emit('webrtc-offer', { from: client.id, offer: data.offer });
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(@ConnectedSocket() client: LiveClient, @MessageBody() data: { targetId: string; answer: unknown }) {
    this.server.to(data.targetId).emit('webrtc-answer', { from: client.id, answer: data.answer });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(@ConnectedSocket() client: LiveClient, @MessageBody() data: { targetId: string; candidate: unknown }) {
    this.server.to(data.targetId).emit('webrtc-ice-candidate', { from: client.id, candidate: data.candidate });
  }
}
