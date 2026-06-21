"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RecommendationController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../core/decorators/current-user.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _recommendationEngine = require("./recommendation-engine.service");
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
let RecommendationController = exports.RecommendationController = class RecommendationController {
  constructor(recommendationService) {
    this.recommendationService = recommendationService;
  }
  /**
   * GET /ai/recommendations
   * Get personalized course recommendations for the authenticated user.
   */
  getRecommendations(userId, tenantId, limit) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.recommendationService.getRecommendations(userId, tenantId, parsedLimit);
  }
  /**
   * GET /ai/recommendations/feed
   * Get a personalized feed with recommendations, trending, and new courses.
   */
  getPersonalizedFeed(userId, tenantId) {
    return this.recommendationService.getPersonalizedFeed(userId, tenantId);
  }
  /**
   * GET /ai/recommendations/popular
   * Get the most popular courses in the tenant.
   */
  getPopularCourses(tenantId, limit) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.recommendationService.getPopularCourses(tenantId, parsedLimit);
  }
  /**
   * GET /ai/recommendations/similar/:courseId
   * Get courses similar to the given course.
   */
  getSimilarCourses(courseId, tenantId, limit) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.recommendationService.getSimilarCourses(courseId, tenantId, parsedLimit);
  }
};
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'Get personalized course recommendations'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _currentUser.CurrentUser)('tenantId')), __param(2, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], RecommendationController.prototype, "getRecommendations", null);
__decorate([(0, _common.Get)('feed'), (0, _swagger.ApiOperation)({
  summary: 'Get personalized feed (recommendations, trending, new)'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _currentUser.CurrentUser)('tenantId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], RecommendationController.prototype, "getPersonalizedFeed", null);
__decorate([(0, _common.Get)('popular'), (0, _swagger.ApiOperation)({
  summary: 'Get popular courses in tenant'
}), __param(0, (0, _currentUser.CurrentUser)('tenantId')), __param(1, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], RecommendationController.prototype, "getPopularCourses", null);
__decorate([(0, _common.Get)('similar/:courseId'), (0, _swagger.ApiOperation)({
  summary: 'Get courses similar to a given course'
}), __param(0, (0, _common.Param)('courseId')), __param(1, (0, _currentUser.CurrentUser)('tenantId')), __param(2, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], RecommendationController.prototype, "getSimilarCourses", null);
exports.RecommendationController = RecommendationController = __decorate([(0, _swagger.ApiTags)('AI Recommendations'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('ai/recommendations'), __param(0, (0, _common.Inject)(_recommendationEngine.RecommendationEngineService)), __metadata("design:paramtypes", [Object])], RecommendationController);