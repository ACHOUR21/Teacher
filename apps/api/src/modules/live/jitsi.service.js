"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JitsiService = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _jwt = require("@nestjs/jwt");
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
let JitsiService = exports.JitsiService = class JitsiService {
  constructor(config, jwtService) {
    this.config = config;
    this.jwtService = jwtService;
  }
  /**
   * Generate a Jitsi Meet JWT for a user to join a room.
   * Signs with JITSI_APP_SECRET, expires in 2 hours.
   */
  generateJitsiToken(params) {
    const appId = this.config.get('JITSI_APP_ID', 'eduai');
    const appSecret = this.config.get('JITSI_APP_SECRET', 'changeme');
    const domain = this.config.get('JITSI_DOMAIN', 'meet.jit.si');
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
          moderator: params.isModerator
        }
      }
    };
    return this.jwtService.sign(payload, {
      secret: appSecret,
      expiresIn: '2h'
    });
  }
  /**
   * Derive a deterministic Jitsi room name from the session ID.
   * Strips hyphens so the name is URL-safe.
   */
  getRoomName(sessionId) {
    return `eduai_${sessionId.replace(/-/g, '')}`;
  }
  /**
   * Build the full Jitsi URL a client should open (or embed in an iframe).
   */
  getJitsiUrl(sessionId, token) {
    const domain = this.config.get('JITSI_DOMAIN', 'meet.jit.si');
    const roomName = this.getRoomName(sessionId);
    return `https://${domain}/${roomName}?jwt=${token}`;
  }
};
exports.JitsiService = JitsiService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __param(1, (0, _common.Inject)(_jwt.JwtService)), __metadata("design:paramtypes", [Object, Object])], JitsiService);