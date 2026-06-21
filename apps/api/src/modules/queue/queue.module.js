"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueueModule = exports.QUEUE_NOTIFICATION = exports.QUEUE_EMAIL = exports.QUEUE_CERTIFICATE = exports.QUEUE_ANALYTICS = exports.QUEUE_AI_PROCESSING = void 0;
var _bull = require("@nestjs/bull");
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const QUEUE_EMAIL = exports.QUEUE_EMAIL = 'email';
const QUEUE_NOTIFICATION = exports.QUEUE_NOTIFICATION = 'notification';
const QUEUE_AI_PROCESSING = exports.QUEUE_AI_PROCESSING = 'ai-processing';
const QUEUE_CERTIFICATE = exports.QUEUE_CERTIFICATE = 'certificate';
const QUEUE_ANALYTICS = exports.QUEUE_ANALYTICS = 'analytics';
let QueueModule = exports.QueueModule = class QueueModule {};
exports.QueueModule = QueueModule = __decorate([(0, _common.Global)(), (0, _common.Module)({
  imports: [_bull.BullModule.forRootAsync({
    imports: [_config.ConfigModule],
    useFactory: configService => ({
      redis: {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD') || undefined,
        db: configService.get('REDIS_DB', 0)
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    }),
    inject: [_config.ConfigService]
  }), _bull.BullModule.registerQueue({
    name: QUEUE_EMAIL
  }, {
    name: QUEUE_NOTIFICATION
  }, {
    name: QUEUE_AI_PROCESSING
  }, {
    name: QUEUE_CERTIFICATE
  }, {
    name: QUEUE_ANALYTICS
  })],
  exports: [_bull.BullModule]
})], QueueModule);