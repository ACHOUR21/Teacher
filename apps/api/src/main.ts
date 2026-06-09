// OpenTelemetry must be initialized before any other imports
import { startTelemetry } from './instrumentation';
startTelemetry();

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './modules/core/filters/all-exceptions.filter';
import { LoggingInterceptor } from './modules/core/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './modules/core/interceptors/timeout.interceptor';
import { TransformInterceptor } from './modules/core/interceptors/transform.interceptor';

const compression = require('compression');
const helmet = require('helmet');

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
  const apiVersion = process.env['npm_package_version'] ?? '1.0.0';
  const swaggerDescription = `
## EduAI Ultimate — Enterprise AI-powered Education Platform

A global multi-tenant SaaS platform combining LMS, School ERP, University ERP, AI Education,
Course Marketplace, Live Classroom, Mobile Ecosystem, White Label SaaS, and a Developer Platform.

### Platform Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Multi-Tenant SaaS** | Tenant provisioning, isolation, plan management |
| 2 | **Super Admin** | Platform-level administration and oversight |
| 3 | **School ERP** | Classes, departments, timetable, attendance |
| 4 | **University ERP** | Faculties, programs, academic enrollments |
| 5 | **AI Education Suite** | AI Tutor, Exam Generator, Lesson & Curriculum builder |
| 6 | **Teacher Ecosystem** | Course authoring, assignments, analytics |
| 7 | **Student Ecosystem** | Learning progress, submissions, performance |
| 8 | **Parent Portal** | Child monitoring, attendance, communication |
| 9 | **Marketplace** | Course discovery, purchase, ratings & reviews |
| 10 | **Live Classroom** | Real-time sessions, recording, whiteboard |
| 11 | **Certificate System** | Template designer, issuance, verification |
| 12 | **Communication Center** | Messaging, announcements, notifications |
| 13 | **Gamification** | Points, badges, leaderboards, streaks |
| 14 | **White Label System** | Custom branding, domain, email |
| 15 | **Billing** | Stripe + PayPal, plans, coupons, invoices |
| 16 | **Analytics BI** | Reports, dashboards, export |
| 17 | **Plugin Marketplace** | Third-party plugin install & management |
| 18 | **API Ecosystem** | API keys, webhooks, rate limiting |
| 19 | **Mobile Apps** | Flutter push notifications & mobile endpoints |
| 20 | **AI Agents Platform** | Autonomous AI agents, tool orchestration |

### Authentication

All protected endpoints require a **Bearer JWT** token in the \`Authorization\` header.
Service-to-service calls may use an **X-API-Key** header instead.
Multi-tenant requests must include **X-Tenant-ID** to identify the active tenant.

### Versioning

This document describes **v1** of the EduAI API. All routes are prefixed with \`/api/v1\`.
  `.trim();

  const config = new DocumentBuilder()
    .setTitle('EduAI Ultimate API')
    .setDescription(swaggerDescription)
    .setVersion(apiVersion)
    .setContact('EduAI Support', 'https://eduai.app', 'support@eduai.app')
    .setLicense('Proprietary', 'https://eduai.app/terms')
    .setExternalDoc('Platform Documentation', 'https://docs.eduai.app')
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://api.eduai.app', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token. Obtain one via POST /api/v1/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        description: 'API key for service-to-service calls. Manage keys via the API Ecosystem module.',
        in: 'header',
      },
      'API-Key',
    )
    .addGlobalParameters({
      in: 'header',
      name: 'X-Tenant-ID',
      required: false,
      schema: { type: 'string' },
      description: 'Tenant identifier (slug or cuid). Required for multi-tenant contexts.',
    })
    // Core platform
    .addTag('Health', 'Liveness and readiness health checks')
    .addTag('Auth', 'Authentication — login, register, refresh, logout, MFA')
    .addTag('Tenants', 'Multi-tenant provisioning, settings, and plan management')
    .addTag('Users', 'User CRUD, profile, roles, device management')
    // Education
    .addTag('Courses', 'Course authoring — sections, lessons, publishing, pricing')
    .addTag('Students', 'Student profiles, progress, performance, submissions')
    .addTag('Teachers', 'Teacher profiles, verification, subject management')
    .addTag('Parents', 'Parent portal — child linking, monitoring, communications')
    // ERP
    .addTag('School ERP', 'Schools, departments, classes, timetables, attendance')
    .addTag('University ERP', 'Universities, faculties, programs, academic enrollments')
    // AI
    .addTag('AI', 'AI Education Suite — tutor, exam/lesson/curriculum generation, flashcards, mind maps')
    .addTag('AI Agents', 'AI Agents Platform — autonomous agents, tool orchestration, pipelines')
    // Commerce & interaction
    .addTag('Marketplace', 'Course discovery, purchase flow, ratings and reviews')
    .addTag('Live', 'Live classroom sessions, recordings, participant management')
    .addTag('Certificates', 'Certificate template design, issuance, public verification')
    .addTag('Gamification', 'Points, XP, badges, leaderboards, streaks, events')
    // Communication
    .addTag('Notifications', 'In-app, email, SMS and push notification delivery')
    .addTag('Messaging', 'Real-time direct and group messaging via WebSocket')
    // Platform services
    .addTag('Billing', 'Subscriptions, plans, Stripe/PayPal, coupons, invoices, revenue analytics')
    .addTag('Analytics', 'Platform analytics, BI dashboards, reports and data export')
    .addTag('White Label', 'Custom branding, domain mapping, email themes')
    .addTag('Plugins', 'Plugin marketplace — discovery, installation, configuration')
    .addTag('API Ecosystem', 'API key management, webhook endpoints, rate limiting')
    .addTag('Search', 'Full-text search across courses, users, and content (Elasticsearch)')
    .addTag('Storage', 'File upload, presigned URLs, S3-compatible object storage')
    .addTag('Audit', 'Immutable audit log — actions, resources, actors, timestamps')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'EduAI Ultimate API Docs',
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); }
      .swagger-ui .topbar-wrapper .link { display: none; }
      .swagger-ui .topbar-wrapper::after { content: 'EduAI Ultimate API'; color: white; font-size: 1.2rem; font-weight: 700; }
    `,
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
