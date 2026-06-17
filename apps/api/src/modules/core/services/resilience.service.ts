import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);
  private readonly circuits = new Map<string, CircuitBreakerState>();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT_MS = 30_000;

  async withRetry<T>(
    name: string,
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const { maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 5000, shouldRetry } = options;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (shouldRetry && !shouldRetry(err)) { break; }
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
          this.logger.warn(`[${name}] attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  async withCircuitBreaker<T>(
    name: string,
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>,
  ): Promise<T> {
    const circuit = this.getCircuit(name);
    const now = Date.now();

    if (circuit.state === 'OPEN') {
      if (now - circuit.lastFailureTime > this.RECOVERY_TIMEOUT_MS) {
        circuit.state = 'HALF_OPEN';
        this.logger.log(`[${name}] circuit HALF_OPEN — probing`);
      } else {
        this.logger.warn(`[${name}] circuit OPEN — using fallback`);
        if (fallback) { return fallback(); }
        throw new ServiceUnavailableException(`${name} service temporarily unavailable`);
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

  async withResilience<T>(
    name: string,
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>,
    retryOptions?: RetryOptions,
  ): Promise<T> {
    return this.withCircuitBreaker(
      name,
      () => this.withRetry(name, fn, retryOptions),
      fallback,
    );
  }

  getCircuitStatus(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuits);
  }

  private getCircuit(name: string): CircuitBreakerState {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, { failures: 0, lastFailureTime: 0, state: 'CLOSED' });
    }
    return this.circuits.get(name)!;
  }
}
