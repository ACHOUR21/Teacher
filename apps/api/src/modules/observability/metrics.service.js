"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MetricsService = void 0;
var _common = require("@nestjs/common");
var _nestjsPrometheus = require("@willsoto/nestjs-prometheus");
var _promClient = require("prom-client");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
let MetricsService = exports.MetricsService = class MetricsService {
  constructor(registrations, activeUsers, enrollments, aiRequests, aiCost, revenue, httpDuration) {
    this.registrations = registrations;
    this.activeUsers = activeUsers;
    this.enrollments = enrollments;
    this.aiRequests = aiRequests;
    this.aiCost = aiCost;
    this.revenue = revenue;
    this.httpDuration = httpDuration;
  }
  recordRegistration(tenantId, plan) {
    this.registrations.inc({
      tenant_id: tenantId,
      plan
    });
  }
  setActiveUsers(tenantId, count) {
    this.activeUsers.set({
      tenant_id: tenantId
    }, count);
  }
  recordEnrollment(tenantId, courseId) {
    this.enrollments.inc({
      tenant_id: tenantId,
      course_id: courseId
    });
  }
  recordAiRequest(tenantId, model, costUsd) {
    this.aiRequests.inc({
      tenant_id: tenantId,
      model
    });
    this.aiCost.inc({
      tenant_id: tenantId,
      model
    }, costUsd);
  }
  recordRevenue(tenantId, plan, amountUsd) {
    this.revenue.inc({
      tenant_id: tenantId,
      plan
    }, amountUsd);
  }
  recordHttpDuration(method, route, status, durationSeconds) {
    this.httpDuration.observe({
      method,
      route,
      status_code: String(status)
    }, durationSeconds);
  }
};
exports.MetricsService = MetricsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _nestjsPrometheus.InjectMetric)('eduai_user_registrations_total')), __param(1, (0, _nestjsPrometheus.InjectMetric)('eduai_active_users_gauge')), __param(2, (0, _nestjsPrometheus.InjectMetric)('eduai_course_enrollments_total')), __param(3, (0, _nestjsPrometheus.InjectMetric)('eduai_ai_requests_total')), __param(4, (0, _nestjsPrometheus.InjectMetric)('eduai_ai_cost_usd_total')), __param(5, (0, _nestjsPrometheus.InjectMetric)('eduai_revenue_usd_total')), __param(6, (0, _nestjsPrometheus.InjectMetric)('eduai_http_request_duration_seconds')), __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object])], MetricsService);