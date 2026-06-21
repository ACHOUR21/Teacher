"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SkillGapType = exports.PerformancePredictionType = exports.PerformanceFactorType = exports.MindMapResultType = exports.MindMapNodeType = exports.LearningStepType = exports.CareerRecommendationType = exports.CareerMatchType = void 0;
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
let MindMapNodeType = exports.MindMapNodeType = class MindMapNodeType {
  id;
  label;
  children;
  color;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], MindMapNodeType.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], MindMapNodeType.prototype, "label", void 0);
__decorate([(0, _graphql.Field)(() => [MindMapNodeType]), __metadata("design:type", Array)], MindMapNodeType.prototype, "children", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], MindMapNodeType.prototype, "color", void 0);
exports.MindMapNodeType = MindMapNodeType = __decorate([(0, _graphql.ObjectType)()], MindMapNodeType);
let MindMapResultType = exports.MindMapResultType = class MindMapResultType {
  topic;
  root;
  generatedAt;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], MindMapResultType.prototype, "topic", void 0);
__decorate([(0, _graphql.Field)(() => MindMapNodeType), __metadata("design:type", MindMapNodeType)], MindMapResultType.prototype, "root", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], MindMapResultType.prototype, "generatedAt", void 0);
exports.MindMapResultType = MindMapResultType = __decorate([(0, _graphql.ObjectType)()], MindMapResultType);
let CareerMatchType = exports.CareerMatchType = class CareerMatchType {
  title;
  matchScore;
  description;
  requiredSkills;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], CareerMatchType.prototype, "title", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], CareerMatchType.prototype, "matchScore", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], CareerMatchType.prototype, "description", void 0);
__decorate([(0, _graphql.Field)(() => [String]), __metadata("design:type", Array)], CareerMatchType.prototype, "requiredSkills", void 0);
exports.CareerMatchType = CareerMatchType = __decorate([(0, _graphql.ObjectType)()], CareerMatchType);
let SkillGapType = exports.SkillGapType = class SkillGapType {
  skill;
  priority;
  recommendedCourses;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], SkillGapType.prototype, "skill", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], SkillGapType.prototype, "priority", void 0);
__decorate([(0, _graphql.Field)(() => [String]), __metadata("design:type", Array)], SkillGapType.prototype, "recommendedCourses", void 0);
exports.SkillGapType = SkillGapType = __decorate([(0, _graphql.ObjectType)()], SkillGapType);
let LearningStepType = exports.LearningStepType = class LearningStepType {
  step;
  action;
  timelineWeeks;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], LearningStepType.prototype, "step", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], LearningStepType.prototype, "action", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], LearningStepType.prototype, "timelineWeeks", void 0);
exports.LearningStepType = LearningStepType = __decorate([(0, _graphql.ObjectType)()], LearningStepType);
let CareerRecommendationType = exports.CareerRecommendationType = class CareerRecommendationType {
  careers;
  skillGaps;
  learningPath;
};
__decorate([(0, _graphql.Field)(() => [CareerMatchType]), __metadata("design:type", Array)], CareerRecommendationType.prototype, "careers", void 0);
__decorate([(0, _graphql.Field)(() => [SkillGapType]), __metadata("design:type", Array)], CareerRecommendationType.prototype, "skillGaps", void 0);
__decorate([(0, _graphql.Field)(() => [LearningStepType]), __metadata("design:type", Array)], CareerRecommendationType.prototype, "learningPath", void 0);
exports.CareerRecommendationType = CareerRecommendationType = __decorate([(0, _graphql.ObjectType)()], CareerRecommendationType);
let PerformanceFactorType = exports.PerformanceFactorType = class PerformanceFactorType {
  name;
  impact;
  weight;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], PerformanceFactorType.prototype, "name", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], PerformanceFactorType.prototype, "impact", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], PerformanceFactorType.prototype, "weight", void 0);
exports.PerformanceFactorType = PerformanceFactorType = __decorate([(0, _graphql.ObjectType)()], PerformanceFactorType);
let PerformancePredictionType = exports.PerformancePredictionType = class PerformancePredictionType {
  studentId;
  predictedGrade;
  confidence;
  riskLevel;
  dropoutRisk;
  recommendations;
  factors;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], PerformancePredictionType.prototype, "studentId", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], PerformancePredictionType.prototype, "predictedGrade", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], PerformancePredictionType.prototype, "confidence", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], PerformancePredictionType.prototype, "riskLevel", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], PerformancePredictionType.prototype, "dropoutRisk", void 0);
__decorate([(0, _graphql.Field)(() => [String]), __metadata("design:type", Array)], PerformancePredictionType.prototype, "recommendations", void 0);
__decorate([(0, _graphql.Field)(() => [PerformanceFactorType]), __metadata("design:type", Array)], PerformancePredictionType.prototype, "factors", void 0);
exports.PerformancePredictionType = PerformancePredictionType = __decorate([(0, _graphql.ObjectType)()], PerformancePredictionType);