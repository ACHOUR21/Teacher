import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';

import { RedisService } from '../cache/redis.service';
import { Public } from '../core/decorators/public.decorator';
import { ResilienceService } from '../core/services/resilience.service';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly resilience: ResilienceService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — DB, Redis, memory' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' as const } };
        } catch (err) {
          return { database: { status: 'down' as const, message: (err as Error).message } };
        }
      },
      async () => {
        try {
          const result = await this.redis.ping();
          return { redis: { status: result === 'PONG' ? ('up' as const) : ('down' as const) } };
        } catch (err) {
          return { redis: { status: 'down' as const, message: (err as Error).message } };
        }
      },
      () => {
        const used = process.memoryUsage();
        return Promise.resolve({
          memory: {
            status: 'up' as const,
            heapUsedMb: Math.round(used.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(used.heapTotal / 1024 / 1024),
            rssMb: Math.round(used.rss / 1024 / 1024),
          },
        });
      },
    ]);
  }

  @Get('live')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Kubernetes liveness probe — always 200 if process is up' })
  live() {
    return { status: 'ok' };
  }

  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Detailed liveness ping with uptime and version' })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
      uptime: Math.round(process.uptime()),
      environment: process.env['NODE_ENV'] ?? 'development',
    };
  }

  @Get('backup')
  @Public()
  @ApiOperation({ summary: 'Backup configuration status — confirms S3 backup target is set' })
  backup() {
    const s3Bucket = process.env['S3_BUCKET'];
    const configured = typeof s3Bucket === 'string' && s3Bucket.trim().length > 0;
    return {
      timestamp: new Date().toISOString(),
      backup: {
        s3_configured: configured,
        s3_bucket: configured ? s3Bucket : null,
        schedule: {
          postgres_daily: '0 2 * * *',
          postgres_weekly: '0 3 * * 0',
          redis_daily: '30 2 * * *',
        },
        retention: {
          postgres_daily_days: 30,
          postgres_weekly_days: 90,
          redis_daily_days: 7,
        },
      },
    };
  }

  @Get('circuits')
  @Public()
  @ApiOperation({ summary: 'Circuit breaker status for all external service integrations' })
  circuits() {
    const status = this.resilience.getCircuitStatus();
    const circuits = Object.entries(status).map(([name, state]) => ({
      name,
      state: state.state,
      failures: state.failures,
      lastFailureTime: state.lastFailureTime > 0 ? new Date(state.lastFailureTime).toISOString() : null,
    }));
    return {
      timestamp: new Date().toISOString(),
      circuits,
      summary: {
        total: circuits.length,
        open: circuits.filter(c => c.state === 'OPEN').length,
        halfOpen: circuits.filter(c => c.state === 'HALF_OPEN').length,
        closed: circuits.filter(c => c.state === 'CLOSED').length,
      },
    };
  }
}
