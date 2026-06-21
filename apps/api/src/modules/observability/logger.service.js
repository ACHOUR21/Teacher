"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StructuredLoggerService = void 0;
var _common = require("@nestjs/common");
var _correlation = require("./correlation.middleware");
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
let StructuredLoggerService = exports.StructuredLoggerService = class StructuredLoggerService extends _common.ConsoleLogger {
  constructor(context) {
    super(context ?? '');
  }
  buildEntry(level, message, context) {
    const store = _correlation.correlationStorage.getStore();
    return {
      level,
      context: context ?? this.context,
      correlationId: store?.correlationId ?? 'no-correlation-id',
      tenantId: store?.tenantId ?? 'system',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      timestamp: new Date().toISOString()
    };
  }
  write(entry) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
  log(message, context) {
    this.write(this.buildEntry('log', message, context));
  }
  error(message, stackOrContext, context) {
    const entry = this.buildEntry('error', message, context ?? stackOrContext);
    // If stackOrContext looks like a stack trace, attach it
    if (stackOrContext && stackOrContext.includes('\n')) {
      entry.stack = stackOrContext;
    }
    this.write(entry);
  }
  warn(message, context) {
    this.write(this.buildEntry('warn', message, context));
  }
  debug(message, context) {
    this.write(this.buildEntry('debug', message, context));
  }
  verbose(message, context) {
    this.write(this.buildEntry('verbose', message, context));
  }
};
exports.StructuredLoggerService = StructuredLoggerService = __decorate([(0, _common.Injectable)({
  scope: _common.Scope.TRANSIENT
}), __param(0, (0, _common.Optional)()), __metadata("design:paramtypes", [Object])], StructuredLoggerService);