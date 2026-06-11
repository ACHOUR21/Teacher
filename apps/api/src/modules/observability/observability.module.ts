import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'eduai_user_registrations_total',
      help: 'Total user registrations by tenant and plan',
      labelNames: ['tenant_id', 'plan'],
    }),
    makeGaugeProvider({
      name: 'eduai_active_users_gauge',
      help: 'Currently active users by tenant',
      labelNames: ['tenant_id'],
    }),
    makeCounterProvider({
      name: 'eduai_course_enrollments_total',
      help: 'Total course enrollments by tenant and course',
      labelNames: ['tenant_id', 'course_id'],
    }),
    makeCounterProvider({
      name: 'eduai_ai_requests_total',
      help: 'Total AI API requests by tenant and model',
      labelNames: ['tenant_id', 'model'],
    }),
    makeCounterProvider({
      name: 'eduai_ai_cost_usd_total',
      help: 'Cumulative AI cost in USD by tenant and model',
      labelNames: ['tenant_id', 'model'],
    }),
    makeCounterProvider({
      name: 'eduai_revenue_usd_total',
      help: 'Cumulative revenue in USD by tenant and plan',
      labelNames: ['tenant_id', 'plan'],
    }),
    makeHistogramProvider({
      name: 'eduai_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    MetricsService,
  ],
  exports: [MetricsService],
})
export class ObservabilityModule {}
