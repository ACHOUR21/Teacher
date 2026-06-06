// OpenTelemetry must be initialized before any other imports
import { startTelemetry } from './instrumentation';
startTelemetry();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmet = require('helmet');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './modules/core/filters/all-exceptions.filter';
import { LoggingInterceptor } from './modules/core/interceptors/logging.interceptor';
import { TransformInterceptor } from './modules/core/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './modules/core/interceptors/timeout.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env['NODE_ENV'] === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProd ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS with tenant-aware origins
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [];
      const allowAll = process.env['CORS_ALLOW_ALL'] === 'true';
      if (allowAll || !origin || allowedOrigins.includes(origin) || origin.endsWith('.eduai.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-API-Key', 'X-Request-ID'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'api/docs'] });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new TimeoutInterceptor(),
  );

  // Socket.IO
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('EduAI Ultimate API')
    .setDescription('Enterprise AI-powered Education Platform API')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'API-Key')
    .addTag('Health', 'Health Checks')
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Tenants', 'Multi-tenant Management')
    .addTag('Users', 'User Management')
    .addTag('Courses', 'Course Management')
    .addTag('Students', 'Student Ecosystem')
    .addTag('Teachers', 'Teacher Ecosystem')
    .addTag('Parents', 'Parent Portal')
    .addTag('AI', 'AI-powered Education Features')
    .addTag('AI Agents', 'AI Agents Platform')
    .addTag('Billing', 'Subscription & Payments')
    .addTag('Live', 'Live Classroom Sessions')
    .addTag('Marketplace', 'Course Marketplace')
    .addTag('Gamification', 'Points, Badges & Leaderboard')
    .addTag('Certificates', 'Certificate Management')
    .addTag('Notifications', 'Notification System')
    .addTag('Messaging', 'Real-time Messaging')
    .addTag('Analytics', 'Analytics & Business Intelligence')
    .addTag('School ERP', 'School ERP — Classes, Departments, Timetable')
    .addTag('University ERP', 'University ERP — Faculties, Programs, Enrollments')
    .addTag('White Label', 'White Label Customization')
    .addTag('Plugins', 'Plugin Marketplace')
    .addTag('API Ecosystem', 'API Keys & Webhooks')
    .addTag('Search', 'Full-text Search')
    .addTag('Storage', 'File Storage')
    .addTag('Audit', 'Audit Logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Graceful shutdown
  app.enableShutdownHooks();
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  const port = process.env['PORT'] || 3001;
  await app.listen(port);
  logger.log(`EduAI Ultimate API running on port ${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
