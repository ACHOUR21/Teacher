"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TenantSummary = exports.TenantPage = exports.PlatformOverview = exports.PlatformKPI = exports.BillingOverview = void 0;
var _graphql = require("@nestjs/graphql");
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
var _a;
let TenantSummary = exports.TenantSummary = class TenantSummary {
  id;
  name;
  plan;
  isActive;
  domain;
  createdAt;
  userCount;
  courseCount;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], TenantSummary.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], TenantSummary.prototype, "name", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], TenantSummary.prototype, "plan", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], TenantSummary.prototype, "isActive", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], TenantSummary.prototype, "domain", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], TenantSummary.prototype, "createdAt", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], TenantSummary.prototype, "userCount", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], TenantSummary.prototype, "courseCount", void 0);
exports.TenantSummary = TenantSummary = __decorate([(0, _graphql.ObjectType)()], TenantSummary);
let TenantPage = exports.TenantPage = class TenantPage {
  items;
  total;
  page;
  totalPages;
};
__decorate([(0, _graphql.Field)(() => [TenantSummary]), __metadata("design:type", Array)], TenantPage.prototype, "items", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], TenantPage.prototype, "total", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], TenantPage.prototype, "page", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], TenantPage.prototype, "totalPages", void 0);
exports.TenantPage = TenantPage = __decorate([(0, _graphql.ObjectType)()], TenantPage);
let PlatformKPI = exports.PlatformKPI = class PlatformKPI {
  totalTenants;
  totalUsers;
  totalCourses;
  totalEnrollments;
  totalRevenue;
  activeTenants;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformKPI.prototype, "totalTenants", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformKPI.prototype, "totalUsers", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformKPI.prototype, "totalCourses", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformKPI.prototype, "totalEnrollments", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], PlatformKPI.prototype, "totalRevenue", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformKPI.prototype, "activeTenants", void 0);
exports.PlatformKPI = PlatformKPI = __decorate([(0, _graphql.ObjectType)()], PlatformKPI);
let PlatformOverview = exports.PlatformOverview = class PlatformOverview {
  kpis;
  recentTenants;
};
__decorate([(0, _graphql.Field)(() => PlatformKPI), __metadata("design:type", PlatformKPI)], PlatformOverview.prototype, "kpis", void 0);
__decorate([(0, _graphql.Field)(() => [TenantSummary]), __metadata("design:type", Array)], PlatformOverview.prototype, "recentTenants", void 0);
exports.PlatformOverview = PlatformOverview = __decorate([(0, _graphql.ObjectType)()], PlatformOverview);
let BillingOverview = exports.BillingOverview = class BillingOverview {
  totalRevenue;
  totalInvoices;
};
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], BillingOverview.prototype, "totalRevenue", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], BillingOverview.prototype, "totalInvoices", void 0);
exports.BillingOverview = BillingOverview = __decorate([(0, _graphql.ObjectType)()], BillingOverview);