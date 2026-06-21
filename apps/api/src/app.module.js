"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppModule = void 0;
var _common = require("@nestjs/common");
var _core = require("@nestjs/core");
var _schedule = require("@nestjs/schedule");
var _throttler = require("@nestjs/throttler");
var _ai = require("./modules/ai/ai.module");
var _aiAgents = require("./modules/ai-agents/ai-agents.module");
var _aiEducation = require("./modules/ai-education/ai-education.module");
var _analytics = require("./modules/analytics/analytics.module");
var _apiEcosystem = require("./modules/api-ecosystem/api-ecosystem.module");
var _assignments = require("./modules/assignments/assignments.module");
var _attendance = require("./modules/attendance/attendance.module");
var _audit = require("./modules/audit/audit.module");
var _auth = require("./modules/auth/auth.module");
var _billing = require("./modules/billing/billing.module");
var _cache = require("./modules/cache/cache.module");
var _certificates = require("./modules/certificates/certificates.module");
var _compliance = require("./modules/compliance/compliance.module");
var _config = require("./modules/config/config.module");
var _core2 = require("./modules/core/core.module");
var _courses = require("./modules/courses/courses.module");
var _dashboard = require("./modules/dashboard/dashboard.module");
var _database = require("./modules/database/database.module");
var _exams = require("./modules/exams/exams.module");
var _featureFlags = require("./modules/feature-flags/feature-flags.module");
var _flashcards = require("./modules/flashcards/flashcards.module");
var _gamification = require("./modules/gamification/gamification.module");
var _gdpr = require("./modules/gdpr/gdpr.module");
var _graphql = require("./modules/graphql/graphql.module");
var _health = require("./modules/health/health.module");
var _live = require("./modules/live/live.module");
var _marketplace = require("./modules/marketplace/marketplace.module");
var _messaging = require("./modules/messaging/messaging.module");
var _metrics = require("./modules/metrics/metrics.middleware");
var _metrics2 = require("./modules/metrics/metrics.module");
var _notifications = require("./modules/notifications/notifications.module");
var _correlation = require("./modules/observability/correlation.middleware");
var _observability = require("./modules/observability/observability.module");
var _parents = require("./modules/parents/parents.module");
var _plugins = require("./modules/plugins/plugins.module");
var _queue = require("./modules/queue/queue.module");
var _quizzes = require("./modules/quizzes/quizzes.module");
var _schoolErp = require("./modules/school-erp/school-erp.module");
var _scim = require("./modules/scim/scim.module");
var _search = require("./modules/search/search.module");
var _storage = require("./modules/storage/storage.module");
var _students = require("./modules/students/students.module");
var _superAdmin = require("./modules/super-admin/super-admin.module");
var _teachers = require("./modules/teachers/teachers.module");
var _tenant = require("./modules/tenants/middleware/tenant.middleware");
var _tenants = require("./modules/tenants/tenants.module");
var _university = require("./modules/university/university.module");
var _universityErp = require("./modules/university-erp/university-erp.module");
var _users = require("./modules/users/users.module");
var _webhooks = require("./modules/webhooks/webhooks.module");
var _whiteLabel = require("./modules/white-label/white-label.module");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AppModule = exports.AppModule = class AppModule {
  configure(consumer) {
    consumer.apply(_correlation.CorrelationMiddleware).forRoutes('*');
    consumer.apply(_metrics.MetricsMiddleware).forRoutes('*');
    consumer.apply(_tenant.TenantMiddleware).exclude({
      path: 'health',
      method: _common.RequestMethod.GET
    }).forRoutes('*');
  }
};
exports.AppModule = AppModule = __decorate([(0, _common.Module)({
  imports: [_config.ConfigAppModule, _throttler.ThrottlerModule.forRoot([{
    name: 'short',
    ttl: 1000,
    limit: 10
  }, {
    name: 'medium',
    ttl: 10000,
    limit: 100
  }, {
    name: 'long',
    ttl: 60000,
    limit: 500
  }]), _schedule.ScheduleModule.forRoot(), _database.DatabaseModule, _cache.CacheModule, _queue.QueueModule, _core2.CoreModule, _auth.AuthModule, _tenants.TenantsModule, _users.UsersModule, _billing.BillingModule, _courses.CoursesModule, _live.LiveModule, _ai.AiModule, _aiEducation.AiEducationModule, _notifications.NotificationsModule, _storage.StorageModule, _search.SearchModule, _analytics.AnalyticsModule, _certificates.CertificatesModule, _gamification.GamificationModule, _audit.AuditModule, _health.HealthModule, _metrics2.MetricsModule, _observability.ObservabilityModule, _schoolErp.SchoolErpModule, _universityErp.UniversityErpModule, _university.UniversityModule, _teachers.TeachersModule, _students.StudentsModule, _parents.ParentsModule, _messaging.MessagingModule, _marketplace.MarketplaceModule, _whiteLabel.WhiteLabelModule, _apiEcosystem.ApiEcosystemModule, _plugins.PluginsModule, _aiAgents.AiAgentsModule, _assignments.AssignmentsModule, _attendance.AttendanceModule, _quizzes.QuizzesModule, _superAdmin.SuperAdminModule, _dashboard.DashboardModule, _exams.ExamsModule, _flashcards.FlashcardsModule, _gdpr.GdprModule, _compliance.ComplianceModule, _graphql.AppGraphQLModule, _featureFlags.FeatureFlagsModule, _scim.ScimModule, _webhooks.WebhooksModule],
  providers: [{
    provide: _core.APP_GUARD,
    useClass: _throttler.ThrottlerGuard
  }]
})], AppModule);