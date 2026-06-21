"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RedisService = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _ioredis = _interopRequireDefault(require("ioredis"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
var RedisService_1;
let RedisService = exports.RedisService = RedisService_1 = class RedisService {
  logger = new _common.Logger(RedisService_1.name);
  client;
  constructor(configService) {
    this.configService = configService;
    this.client = new _ioredis.default({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      db: this.configService.get('REDIS_DB', 0),
      retryStrategy: times => Math.min(times * 50, 2000),
      lazyConnect: true
    });
    this.client.on('error', err => this.logger.error('Redis error:', err.message));
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting...'));
  }
  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn('Redis connection failed, continuing without cache:', error);
    }
  }
  async onModuleDestroy() {
    await this.client.quit();
  }
  async get(key) {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }
  async set(key, value, ttlSeconds) {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${key}:`, error);
    }
  }
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Cache del failed for key ${key}:`, error);
    }
  }
  async getObject(key) {
    const value = await this.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  async setObject(key, value, ttlSeconds) {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Cache delPattern failed for ${pattern}:`, error);
    }
  }
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch {
      return 0;
    }
  }
  async expire(key, seconds) {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.warn(`Cache expire failed for key ${key}:`, error);
    }
  }
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }
  async ping() {
    return this.client.ping();
  }
  getClient() {
    return this.client;
  }
};
exports.RedisService = RedisService = RedisService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __metadata("design:paramtypes", [Object])], RedisService);