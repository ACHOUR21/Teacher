import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';

import { RedisService } from '../cache/redis.service';
import { Public } from '../core/decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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
}
