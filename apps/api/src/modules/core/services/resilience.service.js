"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResilienceService = void 0;
var _common = require("@nestjs/common");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResilienceService_1;
let ResilienceService = exports.ResilienceService = ResilienceService_1 = class ResilienceService {
  logger = new _common.Logger(ResilienceService_1.name);
  circuits = new Map();
  FAILURE_THRESHOLD = 5;
  RECOVERY_TIMEOUT_MS = 30_000;
  async withRetry(name, fn, options = {}) {
    const {
      maxAttempts = 3,
      baseDelayMs = 500,
      maxDelayMs = 5000,
      shouldRetry
    } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (shouldRetry && !shouldRetry(err)) {
          break;
        }
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
          this.logger.warn(`[${name}] attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }
  async withCircuitBreaker(name, fn, fallback) {
    const circuit = this.getCircuit(name);
    const now = Date.now();
    if (circuit.state === 'OPEN') {
      if (now - circuit.lastFailureTime > this.RECOVERY_TIMEOUT_MS) {
        circuit.state = 'HALF_OPEN';
        this.logger.log(`[${name}] circuit HALF_OPEN — probing`);
      } else {
        this.logger.warn(`[${name}] circuit OPEN — using fallback`);
        if (fallback) {
          return fallback();
        }
        throw new _common.ServiceUnavailableException(`${name} service temporarily unavailable`);
      }
    }
    try {
      const result = await fn();
      if (circuit.state === 'HALF_OPEN') {
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        this.logger.log(`[${name}] circuit CLOSED — recovered`);
      }
      return result;
    } catch (err) {
      circuit.failures++;
      circuit.lastFailureTime = now;
      if (circuit.failures >= this.FAILURE_THRESHOLD) {
        circuit.state = 'OPEN';
        this.logger.error(`[${name}] circuit OPEN after ${circuit.failures} failures`);
      }
      if (fallback) {
        this.logger.warn(`[${name}] using fallback after failure`);
        return fallback();
      }
      throw err;
    }
  }
  async withResilience(name, fn, fallback, retryOptions) {
    return this.withCircuitBreaker(name, () => this.withRetry(name, fn, retryOptions), fallback);
  }
  getCircuitStatus() {
    return Object.fromEntries(this.circuits);
  }
  getCircuit(name) {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED'
      });
    }
    return this.circuits.get(name);
  }
};
exports.ResilienceService = ResilienceService = ResilienceService_1 = __decorate([(0, _common.Injectable)()], ResilienceService);