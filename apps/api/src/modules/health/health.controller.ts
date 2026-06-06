import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { Public } from '../core/decorators/public.decorator';

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
  @ApiOperation({ summary: 'Check system health — DB, Redis, and memory' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // PostgreSQL — real query probe
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' as const } };
        } catch (err) {
          return { database: { status: 'down' as const, message: (err as Error).message } };
        }
      },
      // Redis — PING probe
      async () => {
        try {
          const result = await this.redis.ping();
          return { redis: { status: result === 'PONG' ? ('up' as const) : ('down' as const) } };
        } catch (err) {
          return { redis: { status: 'down' as const, message: (err as Error).message } };
        }
      },
      // Memory usage
      () => {
        const used = process.memoryUsage();
        const heapUsedMb = Math.round(used.heapUsed / 1024 / 1024);
        const heapTotalMb = Math.round(used.heapTotal / 1024 / 1024);
        const rssM = Math.round(used.rss / 1024 / 1024);
        return Promise.resolve({
          memory: {
            status: 'up' as const,
            heapUsedMb,
            heapTotalMb,
            rssMb: rssM,
          },
        });
      },
    ]);
  }

  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Simple liveness ping' })
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
