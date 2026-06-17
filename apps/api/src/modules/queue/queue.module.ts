import { BullModule } from '@nestjs/bull';
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const QUEUE_EMAIL = 'email';
export const QUEUE_NOTIFICATION = 'notification';
export const QUEUE_AI_PROCESSING = 'ai-processing';
export const QUEUE_CERTIFICATE = 'certificate';
export const QUEUE_ANALYTICS = 'analytics';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB', 0),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_EMAIL },
      { name: QUEUE_NOTIFICATION },
      { name: QUEUE_AI_PROCESSING },
      { name: QUEUE_CERTIFICATE },
      { name: QUEUE_ANALYTICS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
