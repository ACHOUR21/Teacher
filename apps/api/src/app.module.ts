import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AiModule } from './modules/ai/ai.module';
import { AiEducationModule } from './modules/ai-education/ai-education.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { AiAgentsModule } from './modules/ai-agents/ai-agents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApiEcosystemModule } from './modules/api-ecosystem/api-ecosystem.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CacheModule } from './modules/cache/cache.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ConfigAppModule } from './modules/config/config.module';
import { CoreModule } from './modules/core/core.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DatabaseModule } from './modules/database/database.module';
import { ExamsModule } from './modules/exams/exams.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { GdprModule } from './modules/gdpr/gdpr.module';
import { AppGraphQLModule } from './modules/graphql/graphql.module';
import { HealthModule } from './modules/health/health.module';
import { LiveModule } from './modules/live/live.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { MetricsMiddleware } from './modules/metrics/metrics.middleware';
import { MetricsModule } from './modules/metrics/metrics.module';
import { CorrelationMiddleware } from './modules/observability/correlation.middleware';
import { ObservabilityModule } from './modules/observability/observability.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ParentsModule } from './modules/parents/parents.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { QueueModule } from './modules/queue/queue.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { SchoolErpModule } from './modules/school-erp/school-erp.module';
import { SearchModule } from './modules/search/search.module';
import { StorageModule } from './modules/storage/storage.module';
import { StudentsModule } from './modules/students/students.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { TenantMiddleware } from './modules/tenants/middleware/tenant.middleware';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UniversityErpModule } from './modules/university-erp/university-erp.module';
import { UniversityModule } from './modules/university/university.module';
import { UsersModule } from './modules/users/users.module';
import { ScimModule } from './modules/scim/scim.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';

@Module({
  imports: [
    ConfigAppModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CacheModule,
    QueueModule,
    CoreModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    BillingModule,
    CoursesModule,
    LiveModule,
    AiModule,
    AiEducationModule,
    NotificationsModule,
    StorageModule,
    SearchModule,
    AnalyticsModule,
    CertificatesModule,
    GamificationModule,
    AuditModule,
    HealthModule,
    MetricsModule,
    ObservabilityModule,
    SchoolErpModule,
    UniversityErpModule,
    UniversityModule,
    TeachersModule,
    StudentsModule,
    ParentsModule,
    MessagingModule,
    MarketplaceModule,
    WhiteLabelModule,
    ApiEcosystemModule,
    PluginsModule,
    AiAgentsModule,
    AssignmentsModule,
    AttendanceModule,
    QuizzesModule,
    SuperAdminModule,
    DashboardModule,
    ExamsModule,
    FlashcardsModule,
    GdprModule,
    ComplianceModule,
    AppGraphQLModule,
    FeatureFlagsModule,
    ScimModule,
    WebhooksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes('*');
    consumer
      .apply(MetricsMiddleware)
      .forRoutes('*');
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
