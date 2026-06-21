"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MetricsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _express = require("express");
var _public = require("../core/decorators/public.decorator");
var _metrics = require("./metrics.service");
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
var _a;
let MetricsController = exports.MetricsController = class MetricsController {
  constructor(metricsService) {
    this.metricsService = metricsService;
  }
  async getMetrics(res) {
    res.set('Content-Type', this.metricsService.getContentType());
    res.end(await this.metricsService.getMetrics());
  }
};
__decorate([(0, _common.Get)(), (0, _public.Public)(), (0, _swagger.ApiExcludeEndpoint)(), (0, _swagger.ApiOperation)({
  summary: 'Prometheus metrics scrape endpoint'
}), __param(0, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], MetricsController.prototype, "getMetrics", null);
exports.MetricsController = MetricsController = __decorate([(0, _swagger.ApiTags)('Observability'), (0, _common.Controller)('metrics'), __param(0, (0, _common.Inject)(_metrics.MetricsService)), __metadata("design:paramtypes", [Object])], MetricsController);