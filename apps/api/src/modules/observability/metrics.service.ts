import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('eduai_user_registrations_total') private registrations: Counter<string>,
    @InjectMetric('eduai_active_users_gauge') private activeUsers: Gauge<string>,
    @InjectMetric('eduai_course_enrollments_total') private enrollments: Counter<string>,
    @InjectMetric('eduai_ai_requests_total') private aiRequests: Counter<string>,
    @InjectMetric('eduai_ai_cost_usd_total') private aiCost: Counter<string>,
    @InjectMetric('eduai_revenue_usd_total') private revenue: Counter<string>,
    @InjectMetric('eduai_http_request_duration_seconds') private httpDuration: Histogram<string>,
  ) {}

  recordRegistration(tenantId: string, plan: string) {
    this.registrations.inc({ tenant_id: tenantId, plan });
  }

  setActiveUsers(tenantId: string, count: number) {
    this.activeUsers.set({ tenant_id: tenantId }, count);
  }

  recordEnrollment(tenantId: string, courseId: string) {
    this.enrollments.inc({ tenant_id: tenantId, course_id: courseId });
  }

  recordAiRequest(tenantId: string, model: string, costUsd: number) {
    this.aiRequests.inc({ tenant_id: tenantId, model });
    this.aiCost.inc({ tenant_id: tenantId, model }, costUsd);
  }

  recordRevenue(tenantId: string, plan: string, amountUsd: number) {
    this.revenue.inc({ tenant_id: tenantId, plan }, amountUsd);
  }

  recordHttpDuration(method: string, route: string, status: number, durationSeconds: number) {
    this.httpDuration.observe({ method, route, status_code: String(status) }, durationSeconds);
  }
}
