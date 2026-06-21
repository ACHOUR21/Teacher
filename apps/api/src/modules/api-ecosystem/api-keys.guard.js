"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiKeyGuard = void 0;
var _common = require("@nestjs/common");
var _apiKeys = require("./api-keys.service");
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
/**
 * Guard that validates an API key supplied via:
 *   - Authorization: Bearer eak_...
 *   - X-API-Key: eak_...
 *
 * On success it attaches the validated context to request.apiKeyContext.
 */
let ApiKeyGuard = exports.ApiKeyGuard = class ApiKeyGuard {
  constructor(apiKeysService) {
    this.apiKeysService = apiKeysService;
  }
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const rawKey = this.extractKey(request.headers);
    if (!rawKey) {
      throw new _common.UnauthorizedException('API key is required');
    }
    const validated = await this.apiKeysService.validateApiKey(rawKey);
    if (!validated) {
      throw new _common.UnauthorizedException('Invalid, expired, or revoked API key');
    }
    // Attach to request so controllers/services can read it
    request.apiKeyContext = validated;
    return true;
  }
  extractKey(headers) {
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
};
exports.ApiKeyGuard = ApiKeyGuard = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_apiKeys.ApiKeysService)), __metadata("design:paramtypes", [Object])], ApiKeyGuard);