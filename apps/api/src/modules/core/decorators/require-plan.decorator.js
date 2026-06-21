"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequiresPlanFeature = exports.PLAN_FEATURE_KEY = void 0;
var _common = require("@nestjs/common");
const PLAN_FEATURE_KEY = exports.PLAN_FEATURE_KEY = 'requiredPlanFeature';
/**
 * Attach to a controller method to require the tenant's plan to include a feature.
 * Enforced by PlanGuard.
 *
 * @example
 * @RequiresPlanFeature('liveClassroom')
 * @Get('sessions')
 * listSessions() { ... }
 */
const RequiresPlanFeature = feature => (0, _common.SetMetadata)(PLAN_FEATURE_KEY, feature);
exports.RequiresPlanFeature = RequiresPlanFeature;