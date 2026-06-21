"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DashboardController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../core/decorators/current-user.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _dashboard = require("./dashboard.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let DashboardController = exports.DashboardController = class DashboardController {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }
  stats(user) {
    return this.dashboardService.getStats(user.id);
  }
  recentCourses(user) {
    return this.dashboardService.getRecentCourses(user.id);
  }
  recommendations(user, req) {
    return this.dashboardService.getRecommendations(user.id, req.tenant?.id);
  }
  upcomingSessions(req) {
    return this.dashboardService.getUpcomingSessions(req.tenant?.id);
  }
};
__decorate([(0, _common.Get)('stats'), (0, _swagger.ApiOperation)({
  summary: 'Get dashboard stats for current user'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], DashboardController.prototype, "stats", null);
__decorate([(0, _common.Get)('recent-courses'), (0, _swagger.ApiOperation)({
  summary: 'Get recently accessed courses'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], DashboardController.prototype, "recentCourses", null);
__decorate([(0, _common.Get)('recommendations'), (0, _swagger.ApiOperation)({
  summary: 'Get AI course recommendations'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], DashboardController.prototype, "recommendations", null);
__decorate([(0, _common.Get)('upcoming-sessions'), (0, _swagger.ApiOperation)({
  summary: 'Get upcoming live sessions'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], DashboardController.prototype, "upcomingSessions", null);
exports.DashboardController = DashboardController = __decorate([(0, _swagger.ApiTags)('Dashboard'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('dashboard'), __param(0, (0, _common.Inject)(_dashboard.DashboardService)), __metadata("design:paramtypes", [Object])], DashboardController);