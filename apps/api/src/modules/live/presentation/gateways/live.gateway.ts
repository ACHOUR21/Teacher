/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
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
import { v4 as uuidv4 } from 'uuid';

import { WhiteboardEvent } from '../../dto/whiteboard-event.dto';
import { LiveService } from '../../live.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_REACTIONS = new Set(['👍', '👎', '❤️', '😂', '😮', '👏']);

// ─── In-memory state types ─────────────────────────────────────────────────────

interface PollOption {
  text: string;
  voters: Set<string>; // userIds who voted for this option
}

interface Poll {
  id: string;
  sessionId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
}

interface LiveClient extends Socket {
  userId?: string;
  sessionId?: string;
}

// ─── Gateway ──────────────────────────────────────────────────────────────────

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/live' })
export class LiveGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveGateway.name);

  /** sessionId → Set of userIds currently in the room */
  private readonly participants = new Map<string, Set<string>>();

  /** sessionId → Map of pollId → Poll */
  private readonly polls = new Map<string, Map<string, Poll>>();

  /** sessionId → Set of userIds who have raised hand */
  private readonly raisedHands = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly liveService: LiveService,
  ) {}

  afterInit() {
    this.logger.log('Live WebSocket Gateway initialized');
  }

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  async handleConnection(client: LiveClient) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub as string;
      this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: LiveClient) {
    if (client.sessionId && client.userId) {
      await this.liveService.leaveSession(client.sessionId, client.userId);

      // Remove from in-memory participant set
      const room = this.participants.get(client.sessionId);
      if (room) {
        room.delete(client.userId);
        if (room.size === 0) {
          this.participants.delete(client.sessionId);
        }
      }

      // Clear raised hand on disconnect
      this.raisedHands.get(client.sessionId)?.delete(client.userId);

      const participantList = this._getParticipantList(client.sessionId);
      client.to(`session:${client.sessionId}`).emit('participant-left', { userId: client.userId });
      this.server
        .to(`session:${client.sessionId}`)
        .emit('participant-list', participantList);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Room management ──────────────────────────────────────────────────────

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; token?: string },
  ) {
    if (!client.userId) { return { error: 'Unauthorized' }; }

    const { sessionId } = data;
    const roomName = `session:${sessionId}`;

    await client.join(roomName);
    client.sessionId = sessionId;
    await this.liveService.joinSession(sessionId, client.userId);

    // Track in memory
    if (!this.participants.has(sessionId)) {
      this.participants.set(sessionId, new Set());
    }
    this.participants.get(sessionId)!.add(client.userId);

    const participantList = this._getParticipantList(sessionId);

    // Notify others
    client.to(roomName).emit('participant-joined', {
      userId: client.userId,
      socketId: client.id,
    });

    // Broadcast updated list to whole room
    this.server.to(roomName).emit('participant-list', participantList);

    return { success: true, participants: participantList };
  }

  @SubscribeMessage('leave-session')
  async handleLeaveSession(@ConnectedSocket() client: LiveClient) {
    if (client.sessionId && client.userId) {
      const roomName = `session:${client.sessionId}`;
      await client.leave(roomName);
      await this.liveService.leaveSession(client.sessionId, client.userId);

      this.participants.get(client.sessionId)?.delete(client.userId);
      this.raisedHands.get(client.sessionId)?.delete(client.userId);

      const participantList = this._getParticipantList(client.sessionId);
      client.to(roomName).emit('participant-left', { userId: client.userId });
      this.server.to(roomName).emit('participant-list', participantList);

      client.sessionId = undefined;
    }
    return { success: true };
  }

  // ─── Interactive features ─────────────────────────────────────────────────

  @SubscribeMessage('hand-raise')
  handleHandRaise(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; raised: boolean },
  ) {
    if (!client.sessionId || !client.userId) { return; }

    const sid = client.sessionId;
    if (!this.raisedHands.has(sid)) {
      this.raisedHands.set(sid, new Set());
    }
    if (data.raised) {
      this.raisedHands.get(sid)!.add(client.userId);
    } else {
      this.raisedHands.get(sid)!.delete(client.userId);
    }

    this.server.to(`session:${sid}`).emit('hand-raised', {
      userId: client.userId,
      raised: data.raised,
    });
  }

  @SubscribeMessage('poll-create')
  handlePollCreate(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; question: string; options: string[] },
  ) {
    if (!client.sessionId || !client.userId) { return { error: 'Not in session' }; }
    if (!data.question?.trim() || !Array.isArray(data.options) || data.options.length < 2) {
      return { error: 'Poll must have a question and at least 2 options' };
    }

    const pollId = uuidv4();
    const poll: Poll = {
      id: pollId,
      sessionId: client.sessionId,
      question: data.question.trim().slice(0, 300),
      options: data.options.slice(0, 10).map(o => ({
        text: String(o).trim().slice(0, 200),
        voters: new Set(),
      })),
      createdBy: client.userId,
      createdAt: new Date().toISOString(),
    };

    if (!this.polls.has(client.sessionId)) {
      this.polls.set(client.sessionId, new Map());
    }
    this.polls.get(client.sessionId)!.set(pollId, poll);

    this.server.to(`session:${client.sessionId}`).emit('poll-created', this._serializePoll(poll));
    return { success: true, pollId };
  }

  @SubscribeMessage('poll-vote')
  handlePollVote(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; pollId: string; optionIndex: number },
  ) {
    if (!client.sessionId || !client.userId) { return { error: 'Not in session' }; }

    const sessionPolls = this.polls.get(client.sessionId);
    if (!sessionPolls) { return { error: 'No polls in session' }; }

    const poll = sessionPolls.get(data.pollId);
    if (!poll) { return { error: 'Poll not found' }; }

    const idx = data.optionIndex;
    if (idx < 0 || idx >= poll.options.length) {
      return { error: 'Invalid option index' };
    }

    // Remove any prior vote from this user (one vote per user per poll)
    for (const option of poll.options) {
      option.voters.delete(client.userId!);
    }
    poll.options[idx].voters.add(client.userId!);

    this.server
      .to(`session:${client.sessionId}`)
      .emit('poll-updated', this._serializePoll(poll));
    return { success: true };
  }

  @SubscribeMessage('whiteboard-event')
  handleWhiteboardEvent(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; event: WhiteboardEvent },
  ) {
    if (!client.sessionId) { return; }

    const emit =
      data.event?.type === 'clear'
        ? this.server.to(`session:${client.sessionId}`)
        : client.to(`session:${client.sessionId}`);

    emit.emit('whiteboard-event', { userId: client.userId, event: data.event });
  }

  @SubscribeMessage('chat-message')
  handleChatMessage(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; message: string },
  ) {
    if (!client.sessionId || !client.userId) { return; }

    const sanitized = (data.message ?? '').trim().slice(0, 500);
    if (!sanitized) { return; }

    this.server.to(`session:${client.sessionId}`).emit('chat-message', {
      userId: client.userId,
      message: sanitized,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('reaction')
  handleReaction(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sessionId: string; emoji: string },
  ) {
    if (!client.sessionId || !client.userId) { return; }
    if (!ALLOWED_REACTIONS.has(data.emoji)) { return; }

    this.server.to(`session:${client.sessionId}`).emit('reaction', {
      userId: client.userId,
      emoji: data.emoji,
    });
  }

  // ─── Legacy handlers (kept for backward compat) ───────────────────────────

  @SubscribeMessage('toggle-camera')
  handleToggleCamera(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { enabled: boolean },
  ) {
    if (client.sessionId) {
      client
        .to(`session:${client.sessionId}`)
        .emit('camera-toggled', { userId: client.userId, enabled: data.enabled });
    }
  }

  @SubscribeMessage('toggle-mic')
  handleToggleMic(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { enabled: boolean },
  ) {
    if (client.sessionId) {
      client
        .to(`session:${client.sessionId}`)
        .emit('mic-toggled', { userId: client.userId, enabled: data.enabled });
    }
  }

  @SubscribeMessage('raise-hand')
  handleRaiseHand(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { raised: boolean },
  ) {
    if (client.sessionId) {
      client
        .to(`session:${client.sessionId}`)
        .emit('hand-raised', { userId: client.userId, raised: data.raised });
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { message: string },
  ) {
    if (client.sessionId) {
      this.server.to(`session:${client.sessionId}`).emit('new-message', {
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
      const emit =
        data.type === 'clear'
          ? this.server.to(`session:${client.sessionId}`)
          : client.to(`session:${client.sessionId}`);
      emit.emit('whiteboard-update', { userId: client.userId, data });
    }
  }

  @SubscribeMessage('screen-share')
  handleScreenShare(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { sharing: boolean },
  ) {
    if (client.sessionId) {
      this.server.to(`session:${client.sessionId}`).emit('screen-share-changed', {
        userId: client.userId,
        sharing: data.sharing,
      });
    }
  }

  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { targetId: string; offer: unknown },
  ) {
    this.server
      .to(data.targetId)
      .emit('webrtc-offer', { from: client.id, offer: data.offer });
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { targetId: string; answer: unknown },
  ) {
    this.server
      .to(data.targetId)
      .emit('webrtc-answer', { from: client.id, answer: data.answer });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: LiveClient,
    @MessageBody() data: { targetId: string; candidate: unknown },
  ) {
    this.server
      .to(data.targetId)
      .emit('webrtc-ice-candidate', { from: client.id, candidate: data.candidate });
  }

  // ─── Public accessor for controller ───────────────────────────────────────

  /**
   * Returns the set of userIds currently connected in a session.
   * Used by the HTTP controller to serve the participants endpoint.
   */
  getConnectedParticipants(sessionId: string): string[] {
    return Array.from(this.participants.get(sessionId) ?? []);
  }

  /**
   * Force-disconnects all sockets in a session room (used when ending a session).
   */
  disconnectSession(sessionId: string): void {
    this.server
      .to(`session:${sessionId}`)
      .emit('session-ended', { sessionId });
    // Clients will disconnect themselves on receiving 'session-ended'
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _getParticipantList(sessionId: string): string[] {
    return Array.from(this.participants.get(sessionId) ?? []);
  }

  private _serializePoll(poll: Poll) {
    return {
      id: poll.id,
      sessionId: poll.sessionId,
      question: poll.question,
      createdBy: poll.createdBy,
      createdAt: poll.createdAt,
      options: poll.options.map((o, i) => ({
        index: i,
        text: o.text,
        votes: o.voters.size,
      })),
      totalVotes: poll.options.reduce((sum, o) => sum + o.voters.size, 0),
    };
  }
}
