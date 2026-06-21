"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LiveGateway = void 0;
var _common = require("@nestjs/common");
var _jwt = require("@nestjs/jwt");
var _websockets = require("@nestjs/websockets");
var _socket = require("socket.io");
var _crypto = require("crypto");
var _live = require("../../live.service");
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
var LiveGateway_1;
var _a;
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_REACTIONS = new Set(['👍', '👎', '❤️', '😂', '😮', '👏']);
// ─── Gateway ──────────────────────────────────────────────────────────────────
let LiveGateway = exports.LiveGateway = LiveGateway_1 = class LiveGateway {
  server;
  logger = new _common.Logger(LiveGateway_1.name);
  /** sessionId → Set of userIds currently in the room */
  participants = new Map();
  /** sessionId → Map of pollId → Poll */
  polls = new Map();
  /** sessionId → Set of userIds who have raised hand */
  raisedHands = new Map();
  constructor(jwtService, liveService) {
    this.jwtService = jwtService;
    this.liveService = liveService;
  }
  afterInit() {
    this.logger.log('Live WebSocket Gateway initialized');
  }
  // ─── Connection lifecycle ──────────────────────────────────────────────────
  async handleConnection(client) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch {
      client.disconnect();
    }
  }
  async handleDisconnect(client) {
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
      client.to(`session:${client.sessionId}`).emit('participant-left', {
        userId: client.userId
      });
      this.server.to(`session:${client.sessionId}`).emit('participant-list', participantList);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  // ─── Room management ──────────────────────────────────────────────────────
  async handleJoinSession(client, data) {
    if (!client.userId) {
      return {
        error: 'Unauthorized'
      };
    }
    const {
      sessionId
    } = data;
    const roomName = `session:${sessionId}`;
    await client.join(roomName);
    client.sessionId = sessionId;
    await this.liveService.joinSession(sessionId, client.userId);
    // Track in memory
    if (!this.participants.has(sessionId)) {
      this.participants.set(sessionId, new Set());
    }
    this.participants.get(sessionId).add(client.userId);
    const participantList = this._getParticipantList(sessionId);
    // Notify others
    client.to(roomName).emit('participant-joined', {
      userId: client.userId,
      socketId: client.id
    });
    // Broadcast updated list to whole room
    this.server.to(roomName).emit('participant-list', participantList);
    return {
      success: true,
      participants: participantList
    };
  }
  async handleLeaveSession(client) {
    if (client.sessionId && client.userId) {
      const roomName = `session:${client.sessionId}`;
      await client.leave(roomName);
      await this.liveService.leaveSession(client.sessionId, client.userId);
      this.participants.get(client.sessionId)?.delete(client.userId);
      this.raisedHands.get(client.sessionId)?.delete(client.userId);
      const participantList = this._getParticipantList(client.sessionId);
      client.to(roomName).emit('participant-left', {
        userId: client.userId
      });
      this.server.to(roomName).emit('participant-list', participantList);
      client.sessionId = undefined;
    }
    return {
      success: true
    };
  }
  // ─── Interactive features ─────────────────────────────────────────────────
  handleHandRaise(client, data) {
    if (!client.sessionId || !client.userId) {
      return;
    }
    const sid = client.sessionId;
    if (!this.raisedHands.has(sid)) {
      this.raisedHands.set(sid, new Set());
    }
    if (data.raised) {
      this.raisedHands.get(sid).add(client.userId);
    } else {
      this.raisedHands.get(sid).delete(client.userId);
    }
    this.server.to(`session:${sid}`).emit('hand-raised', {
      userId: client.userId,
      raised: data.raised
    });
  }
  handlePollCreate(client, data) {
    if (!client.sessionId || !client.userId) {
      return {
        error: 'Not in session'
      };
    }
    if (!data.question?.trim() || !Array.isArray(data.options) || data.options.length < 2) {
      return {
        error: 'Poll must have a question and at least 2 options'
      };
    }
    const pollId = (0, _crypto.randomUUID)();
    const poll = {
      id: pollId,
      sessionId: client.sessionId,
      question: data.question.trim().slice(0, 300),
      options: data.options.slice(0, 10).map(o => ({
        text: String(o).trim().slice(0, 200),
        voters: new Set()
      })),
      createdBy: client.userId,
      createdAt: new Date().toISOString()
    };
    if (!this.polls.has(client.sessionId)) {
      this.polls.set(client.sessionId, new Map());
    }
    this.polls.get(client.sessionId).set(pollId, poll);
    this.server.to(`session:${client.sessionId}`).emit('poll-created', this._serializePoll(poll));
    return {
      success: true,
      pollId
    };
  }
  handlePollVote(client, data) {
    if (!client.sessionId || !client.userId) {
      return {
        error: 'Not in session'
      };
    }
    const sessionPolls = this.polls.get(client.sessionId);
    if (!sessionPolls) {
      return {
        error: 'No polls in session'
      };
    }
    const poll = sessionPolls.get(data.pollId);
    if (!poll) {
      return {
        error: 'Poll not found'
      };
    }
    const idx = data.optionIndex;
    if (idx < 0 || idx >= poll.options.length) {
      return {
        error: 'Invalid option index'
      };
    }
    // Remove any prior vote from this user (one vote per user per poll)
    for (const option of poll.options) {
      option.voters.delete(client.userId);
    }
    poll.options[idx].voters.add(client.userId);
    this.server.to(`session:${client.sessionId}`).emit('poll-updated', this._serializePoll(poll));
    return {
      success: true
    };
  }
  handleWhiteboardEvent(client, data) {
    if (!client.sessionId) {
      return;
    }
    const emit = data.event?.type === 'clear' ? this.server.to(`session:${client.sessionId}`) : client.to(`session:${client.sessionId}`);
    emit.emit('whiteboard-event', {
      userId: client.userId,
      event: data.event
    });
  }
  handleChatMessage(client, data) {
    if (!client.sessionId || !client.userId) {
      return;
    }
    const sanitized = (data.message ?? '').trim().slice(0, 500);
    if (!sanitized) {
      return;
    }
    this.server.to(`session:${client.sessionId}`).emit('chat-message', {
      userId: client.userId,
      message: sanitized,
      timestamp: new Date().toISOString()
    });
  }
  handleReaction(client, data) {
    if (!client.sessionId || !client.userId) {
      return;
    }
    if (!ALLOWED_REACTIONS.has(data.emoji)) {
      return;
    }
    this.server.to(`session:${client.sessionId}`).emit('reaction', {
      userId: client.userId,
      emoji: data.emoji
    });
  }
  // ─── Legacy handlers (kept for backward compat) ───────────────────────────
  handleToggleCamera(client, data) {
    if (client.sessionId) {
      client.to(`session:${client.sessionId}`).emit('camera-toggled', {
        userId: client.userId,
        enabled: data.enabled
      });
    }
  }
  handleToggleMic(client, data) {
    if (client.sessionId) {
      client.to(`session:${client.sessionId}`).emit('mic-toggled', {
        userId: client.userId,
        enabled: data.enabled
      });
    }
  }
  handleRaiseHand(client, data) {
    if (client.sessionId) {
      client.to(`session:${client.sessionId}`).emit('hand-raised', {
        userId: client.userId,
        raised: data.raised
      });
    }
  }
  handleSendMessage(client, data) {
    if (client.sessionId) {
      this.server.to(`session:${client.sessionId}`).emit('new-message', {
        userId: client.userId,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  handleWhiteboardDraw(client, data) {
    if (client.sessionId) {
      const emit = data.type === 'clear' ? this.server.to(`session:${client.sessionId}`) : client.to(`session:${client.sessionId}`);
      emit.emit('whiteboard-update', {
        userId: client.userId,
        data
      });
    }
  }
  handleScreenShare(client, data) {
    if (client.sessionId) {
      this.server.to(`session:${client.sessionId}`).emit('screen-share-changed', {
        userId: client.userId,
        sharing: data.sharing
      });
    }
  }
  handleOffer(client, data) {
    this.server.to(data.targetId).emit('webrtc-offer', {
      from: client.id,
      offer: data.offer
    });
  }
  handleAnswer(client, data) {
    this.server.to(data.targetId).emit('webrtc-answer', {
      from: client.id,
      answer: data.answer
    });
  }
  handleIceCandidate(client, data) {
    this.server.to(data.targetId).emit('webrtc-ice-candidate', {
      from: client.id,
      candidate: data.candidate
    });
  }
  // ─── Public accessor for controller ───────────────────────────────────────
  /**
   * Returns the set of userIds currently connected in a session.
   * Used by the HTTP controller to serve the participants endpoint.
   */
  getConnectedParticipants(sessionId) {
    return Array.from(this.participants.get(sessionId) ?? []);
  }
  /**
   * Force-disconnects all sockets in a session room (used when ending a session).
   */
  disconnectSession(sessionId) {
    this.server.to(`session:${sessionId}`).emit('session-ended', {
      sessionId
    });
    // Clients will disconnect themselves on receiving 'session-ended'
  }
  // ─── Private helpers ──────────────────────────────────────────────────────
  _getParticipantList(sessionId) {
    return Array.from(this.participants.get(sessionId) ?? []);
  }
  _serializePoll(poll) {
    return {
      id: poll.id,
      sessionId: poll.sessionId,
      question: poll.question,
      createdBy: poll.createdBy,
      createdAt: poll.createdAt,
      options: poll.options.map((o, i) => ({
        index: i,
        text: o.text,
        votes: o.voters.size
      })),
      totalVotes: poll.options.reduce((sum, o) => sum + o.voters.size, 0)
    };
  }
};
__decorate([(0, _websockets.WebSocketServer)(), __metadata("design:type", typeof (_a = typeof _socket.Server !== "undefined" && _socket.Server) === "function" ? _a : Object)], LiveGateway.prototype, "server", void 0);
__decorate([(0, _websockets.SubscribeMessage)('join-session'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", Promise)], LiveGateway.prototype, "handleJoinSession", null);
__decorate([(0, _websockets.SubscribeMessage)('leave-session'), __param(0, (0, _websockets.ConnectedSocket)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], LiveGateway.prototype, "handleLeaveSession", null);
__decorate([(0, _websockets.SubscribeMessage)('hand-raise'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleHandRaise", null);
__decorate([(0, _websockets.SubscribeMessage)('poll-create'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handlePollCreate", null);
__decorate([(0, _websockets.SubscribeMessage)('poll-vote'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handlePollVote", null);
__decorate([(0, _websockets.SubscribeMessage)('whiteboard-event'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleWhiteboardEvent", null);
__decorate([(0, _websockets.SubscribeMessage)('chat-message'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleChatMessage", null);
__decorate([(0, _websockets.SubscribeMessage)('reaction'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleReaction", null);
__decorate([(0, _websockets.SubscribeMessage)('toggle-camera'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleToggleCamera", null);
__decorate([(0, _websockets.SubscribeMessage)('toggle-mic'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleToggleMic", null);
__decorate([(0, _websockets.SubscribeMessage)('raise-hand'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleRaiseHand", null);
__decorate([(0, _websockets.SubscribeMessage)('send-message'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleSendMessage", null);
__decorate([(0, _websockets.SubscribeMessage)('whiteboard-draw'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleWhiteboardDraw", null);
__decorate([(0, _websockets.SubscribeMessage)('screen-share'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleScreenShare", null);
__decorate([(0, _websockets.SubscribeMessage)('webrtc-offer'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleOffer", null);
__decorate([(0, _websockets.SubscribeMessage)('webrtc-answer'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleAnswer", null);
__decorate([(0, _websockets.SubscribeMessage)('webrtc-ice-candidate'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], LiveGateway.prototype, "handleIceCandidate", null);
exports.LiveGateway = LiveGateway = LiveGateway_1 = __decorate([(0, _websockets.WebSocketGateway)({
  cors: {
    origin: '*'
  },
  namespace: '/live'
}), __param(0, (0, _common.Inject)(_jwt.JwtService)), __param(1, (0, _common.Inject)(_live.LiveService)), __metadata("design:paramtypes", [Object, Object])], LiveGateway);