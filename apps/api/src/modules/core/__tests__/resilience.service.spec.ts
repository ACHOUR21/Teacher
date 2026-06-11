import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ResilienceService } from '../services/resilience.service';

describe('ResilienceService', () => {
  let service: ResilienceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResilienceService],
    }).compile();
    service = module.get<ResilienceService>(ResilienceService);
  });

  // ─── withRetry ────────────────────────────────────────────────────────────

  describe('withRetry', () => {
    it('returns result immediately when fn succeeds on the first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      const result = await service.withRetry('test', fn, { maxAttempts: 3 });
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and returns result when a later attempt succeeds', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('recovered');

      const result = await service.withRetry('test', fn, {
        maxAttempts: 3,
        baseDelayMs: 0,
      });
      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('exhausts all retries and re-throws the last error', async () => {
      const error = new Error('permanent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        service.withRetry('test', fn, { maxAttempts: 3, baseDelayMs: 0 }),
      ).rejects.toThrow('permanent failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('stops retrying immediately when shouldRetry returns false', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('non-retryable'));

      await expect(
        service.withRetry('test', fn, {
          maxAttempts: 5,
          baseDelayMs: 0,
          shouldRetry: () => false,
        }),
      ).rejects.toThrow('non-retryable');
      // Should only call once then break
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ─── withCircuitBreaker ───────────────────────────────────────────────────

  describe('withCircuitBreaker', () => {
    it('starts CLOSED and passes calls through normally', async () => {
      const fn = jest.fn().mockResolvedValue('data');
      const result = await service.withCircuitBreaker('svc', fn);
      expect(result).toBe('data');
      expect(service.getCircuitStatus()['svc'].state).toBe('CLOSED');
    });

    it('transitions from CLOSED to OPEN after reaching the failure threshold', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('down'));
      const THRESHOLD = 5;

      for (let i = 0; i < THRESHOLD; i++) {
        try {
          await service.withCircuitBreaker('svc', fn);
        } catch {
          // expected
        }
      }

      expect(service.getCircuitStatus()['svc'].state).toBe('OPEN');
    });

    it('returns fallback immediately when circuit is OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('down'));
      const THRESHOLD = 5;

      // Trip the circuit
      for (let i = 0; i < THRESHOLD; i++) {
        try {
          await service.withCircuitBreaker('svc', fn);
        } catch {
          // expected
        }
      }

      // Now circuit is OPEN — subsequent calls should use the fallback without calling fn
      fn.mockClear();
      const result = await service.withCircuitBreaker('svc', fn, () => 'fallback-value');
      expect(result).toBe('fallback-value');
      expect(fn).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when OPEN and no fallback is provided', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('down'));
      const THRESHOLD = 5;

      for (let i = 0; i < THRESHOLD; i++) {
        try {
          await service.withCircuitBreaker('svc', fn);
        } catch {
          // expected
        }
      }

      await expect(service.withCircuitBreaker('svc', fn)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('transitions to HALF_OPEN after recovery timeout and closes on probe success', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('down'));
      const THRESHOLD = 5;

      for (let i = 0; i < THRESHOLD; i++) {
        try {
          await service.withCircuitBreaker('svc', fn);
        } catch {
          // expected
        }
      }
      expect(service.getCircuitStatus()['svc'].state).toBe('OPEN');

      // Manually backdate lastFailureTime to simulate recovery timeout elapsed
      const circuit = (service as any).circuits.get('svc');
      circuit.lastFailureTime = Date.now() - 31_000;

      // Next call should probe (HALF_OPEN) and succeed → CLOSED
      fn.mockResolvedValue('recovered');
      const result = await service.withCircuitBreaker('svc', fn);
      expect(result).toBe('recovered');
      expect(service.getCircuitStatus()['svc'].state).toBe('CLOSED');
      expect(service.getCircuitStatus()['svc'].failures).toBe(0);
    });

    it('uses fallback on failure and increments failure count', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('error'));
      const result = await service.withCircuitBreaker('svc', fn, () => 'fallback');
      expect(result).toBe('fallback');
      expect(service.getCircuitStatus()['svc'].failures).toBe(1);
    });
  });

  // ─── withResilience ───────────────────────────────────────────────────────

  describe('withResilience', () => {
    it('combines retry and circuit breaker, returning result on eventual success', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('transient'))
        .mockResolvedValue('success');

      const result = await service.withResilience('svc', fn, undefined, {
        maxAttempts: 3,
        baseDelayMs: 0,
      });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('invokes fallback when all retries are exhausted and circuit remains closed', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent'));
      const result = await service.withResilience(
        'svc',
        fn,
        () => 'safe-fallback',
        { maxAttempts: 2, baseDelayMs: 0 },
      );
      expect(result).toBe('safe-fallback');
    });
  });

  // ─── getCircuitStatus ─────────────────────────────────────────────────────

  describe('getCircuitStatus', () => {
    it('returns empty object when no circuits have been accessed', () => {
      expect(service.getCircuitStatus()).toEqual({});
    });

    it('returns status for all circuits that have been exercised', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      await service.withCircuitBreaker('alpha', fn);
      await service.withCircuitBreaker('beta', fn);

      const status = service.getCircuitStatus();
      expect(Object.keys(status)).toEqual(expect.arrayContaining(['alpha', 'beta']));
      expect(status['alpha'].state).toBe('CLOSED');
      expect(status['beta'].state).toBe('CLOSED');
    });
  });
});
