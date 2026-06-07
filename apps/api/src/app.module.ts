import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigAppModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';
import { CoreModule } from './modules/core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { BillingModule } from './modules/billing/billing.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LiveModule } from './modules/live/live.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { SchoolErpModule } from './modules/school-erp/school-erp.module';
import { UniversityErpModule } from './modules/university-erp/university-erp.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StudentsModule } from './modules/students/students.module';
import { ParentsModule } from './modules/parents/parents.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { ApiEcosystemModule } from './modules/api-ecosystem/api-ecosystem.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { AiAgentsModule } from './modules/ai-agents/ai-agents.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { AppGraphQLModule } from './modules/graphql/graphql.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TenantMiddleware } from './modules/tenants/middleware/tenant.middleware';

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
    NotificationsModule,
    StorageModule,
    SearchModule,
    AnalyticsModule,
    CertificatesModule,
    GamificationModule,
    AuditModule,
    HealthModule,
    SchoolErpModule,
    UniversityErpModule,
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
    QuizzesModule,
    SuperAdminModule,
    DashboardModule,
    AppGraphQLModule,
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
      .apply(TenantMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
