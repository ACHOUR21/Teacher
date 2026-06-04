import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check system health' })
  check() {
    return this.health.check([
      () => ({
        database: {
          status: 'up' as const,
          message: 'PostgreSQL is connected',
        },
      }),
    ]);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping check' })
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' };
  }
}
