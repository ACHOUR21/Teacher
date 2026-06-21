"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiAdvancedResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _careerAdvisor = require("../../ai-education/career-advisor.service");
var _mindMap = require("../../ai-education/mind-map.service");
var _performancePrediction = require("../../ai-education/performance-prediction.service");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _gqlAuth = require("../guards/gql-auth.guard");
var _aiAdvanced = require("../types/ai-advanced.types");
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
var _a, _b, _c;
/* eslint-disable @typescript-eslint/no-unsafe-return */

let AiAdvancedResolver = exports.AiAdvancedResolver = class AiAdvancedResolver {
  constructor(mindMapService, careerAdvisorService, performancePredictionService) {
    this.mindMapService = mindMapService;
    this.careerAdvisorService = careerAdvisorService;
    this.performancePredictionService = performancePredictionService;
  }
  async generateMindMap(topic, depth, user) {
    const result = await this.mindMapService.generateMindMap(user.id, user.tenantId, topic, depth);
    return result;
  }
  async getCareerRecommendations(user) {
    const result = await this.careerAdvisorService.getCareerRecommendations(user.id, user.tenantId);
    return result;
  }
  async predictMyPerformance(user, _courseId) {
    const studentId = (await this.performancePredictionService.findStudentIdByUserId(user.id)) ?? user.id;
    const result = await this.performancePredictionService.predictPerformance(studentId, user.tenantId);
    return result;
  }
};
__decorate([(0, _graphql.Query)(() => _aiAdvanced.MindMapResultType, {
  name: 'generateMindMap',
  description: 'Generate an AI mind map for a topic'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('topic')), __param(1, (0, _graphql.Args)('depth', {
  nullable: true,
  defaultValue: 'deep'
})), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], AiAdvancedResolver.prototype, "generateMindMap", null);
__decorate([(0, _graphql.Query)(() => _aiAdvanced.CareerRecommendationType, {
  name: 'getCareerRecommendations',
  description: 'Get AI career recommendations for the current user'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], AiAdvancedResolver.prototype, "getCareerRecommendations", null);
__decorate([(0, _graphql.Query)(() => _aiAdvanced.PerformancePredictionType, {
  name: 'predictMyPerformance',
  description: 'Predict performance for the current student'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _graphql.Args)('courseId', {
  nullable: true
})), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)], AiAdvancedResolver.prototype, "predictMyPerformance", null);
exports.AiAdvancedResolver = AiAdvancedResolver = __decorate([(0, _graphql.Resolver)(), __param(0, (0, _common.Inject)(_mindMap.MindMapService)), __param(1, (0, _common.Inject)(_careerAdvisor.CareerAdvisorService)), __param(2, (0, _common.Inject)(_performancePrediction.PerformancePredictionService)), __metadata("design:paramtypes", [Object, Object, Object])], AiAdvancedResolver);