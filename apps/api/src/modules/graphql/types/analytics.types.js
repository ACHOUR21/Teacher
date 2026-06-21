"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StudentActivity = exports.PlatformStats = exports.MonthlyRevenue = exports.DailyGrowth = exports.AIModuleUsage = void 0;
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
let PlatformStats = exports.PlatformStats = class PlatformStats {
  totalUsers;
  totalCourses;
  activeSessions;
  totalRevenue;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformStats.prototype, "totalUsers", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformStats.prototype, "totalCourses", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PlatformStats.prototype, "activeSessions", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], PlatformStats.prototype, "totalRevenue", void 0);
exports.PlatformStats = PlatformStats = __decorate([(0, _graphql.ObjectType)()], PlatformStats);
let DailyGrowth = exports.DailyGrowth = class DailyGrowth {
  date;
  count;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], DailyGrowth.prototype, "date", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], DailyGrowth.prototype, "count", void 0);
exports.DailyGrowth = DailyGrowth = __decorate([(0, _graphql.ObjectType)()], DailyGrowth);
let StudentActivity = exports.StudentActivity = class StudentActivity {
  activeStudents;
  completions;
  submissions;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], StudentActivity.prototype, "activeStudents", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], StudentActivity.prototype, "completions", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], StudentActivity.prototype, "submissions", void 0);
exports.StudentActivity = StudentActivity = __decorate([(0, _graphql.ObjectType)()], StudentActivity);
let MonthlyRevenue = exports.MonthlyRevenue = class MonthlyRevenue {
  month;
  revenue;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], MonthlyRevenue.prototype, "month", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], MonthlyRevenue.prototype, "revenue", void 0);
exports.MonthlyRevenue = MonthlyRevenue = __decorate([(0, _graphql.ObjectType)()], MonthlyRevenue);
let AIModuleUsage = exports.AIModuleUsage = class AIModuleUsage {
  module;
  requestCount;
  totalTokens;
  totalCost;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], AIModuleUsage.prototype, "module", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], AIModuleUsage.prototype, "requestCount", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], AIModuleUsage.prototype, "totalTokens", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], AIModuleUsage.prototype, "totalCost", void 0);
exports.AIModuleUsage = AIModuleUsage = __decorate([(0, _graphql.ObjectType)()], AIModuleUsage);