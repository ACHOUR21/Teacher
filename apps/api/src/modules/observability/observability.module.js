"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObservabilityModule = void 0;
var _common = require("@nestjs/common");
var _nestjsPrometheus = require("@willsoto/nestjs-prometheus");
var _metrics = require("./metrics.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let ObservabilityModule = exports.ObservabilityModule = class ObservabilityModule {};
exports.ObservabilityModule = ObservabilityModule = __decorate([(0, _common.Global)(), (0, _common.Module)({
  imports: [_nestjsPrometheus.PrometheusModule.register({
    defaultMetrics: {
      enabled: false
    }
  })],
  providers: [(0, _nestjsPrometheus.makeCounterProvider)({
    name: 'eduai_user_registrations_total',
    help: 'Total user registrations by tenant and plan',
    labelNames: ['tenant_id', 'plan']
  }), (0, _nestjsPrometheus.makeGaugeProvider)({
    name: 'eduai_active_users_gauge',
    help: 'Currently active users by tenant',
    labelNames: ['tenant_id']
  }), (0, _nestjsPrometheus.makeCounterProvider)({
    name: 'eduai_course_enrollments_total',
    help: 'Total course enrollments by tenant and course',
    labelNames: ['tenant_id', 'course_id']
  }), (0, _nestjsPrometheus.makeCounterProvider)({
    name: 'eduai_ai_requests_total',
    help: 'Total AI API requests by tenant and model',
    labelNames: ['tenant_id', 'model']
  }), (0, _nestjsPrometheus.makeCounterProvider)({
    name: 'eduai_ai_cost_usd_total',
    help: 'Cumulative AI cost in USD by tenant and model',
    labelNames: ['tenant_id', 'model']
  }), (0, _nestjsPrometheus.makeCounterProvider)({
    name: 'eduai_revenue_usd_total',
    help: 'Cumulative revenue in USD by tenant and plan',
    labelNames: ['tenant_id', 'plan']
  }), (0, _nestjsPrometheus.makeHistogramProvider)({
    name: 'eduai_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  }), _metrics.MetricsService],
  exports: [_metrics.MetricsService]
})], ObservabilityModule);