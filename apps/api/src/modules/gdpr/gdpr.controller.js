"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GdprController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../core/decorators/current-user.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _gdpr = require("./gdpr.service");
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
let GdprController = exports.GdprController = class GdprController {
  constructor(gdpr) {
    this.gdpr = gdpr;
  }
  async exportData(user) {
    return this.gdpr.exportUserData(user.id);
  }
  async getConsents(user) {
    return this.gdpr.getConsents(user.id);
  }
  async updateConsents(user, body, ip, userAgent) {
    await this.gdpr.upsertConsents(user.id, user.tenantId, body.consents, {
      ipAddress: ip,
      userAgent
    });
    return {
      message: 'Consents updated'
    };
  }
  async getDeletion(user) {
    return this.gdpr.getDeletionRequest(user.id);
  }
  async requestDeletion(user, body) {
    return this.gdpr.requestDeletion(user.id, user.tenantId, body.reason);
  }
  async cancelDeletion(user) {
    await this.gdpr.cancelDeletion(user.id);
    return {
      message: 'Deletion request cancelled — your account has been reactivated'
    };
  }
};
__decorate([(0, _common.Get)('export'), (0, _swagger.ApiOperation)({
  summary: 'Export all personal data (GDPR Article 15/20)'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GdprController.prototype, "exportData", null);
__decorate([(0, _common.Get)('consents'), (0, _swagger.ApiOperation)({
  summary: 'Get current consent records'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GdprController.prototype, "getConsents", null);
__decorate([(0, _common.Put)('consents'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Update consent preferences'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __param(2, (0, _common.Ip)()), __param(3, (0, _common.Headers)('user-agent')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, String, String]), __metadata("design:returntype", Promise)], GdprController.prototype, "updateConsents", null);
__decorate([(0, _common.Get)('deletion-request'), (0, _swagger.ApiOperation)({
  summary: 'Get current deletion request status'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GdprController.prototype, "getDeletion", null);
__decorate([(0, _common.Post)('deletion-request'), (0, _common.HttpCode)(_common.HttpStatus.CREATED), (0, _swagger.ApiOperation)({
  summary: 'Request account deletion (30-day grace period)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", Promise)], GdprController.prototype, "requestDeletion", null);
__decorate([(0, _common.Delete)('deletion-request'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Cancel a pending deletion request'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GdprController.prototype, "cancelDeletion", null);
exports.GdprController = GdprController = __decorate([(0, _swagger.ApiTags)('GDPR'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('gdpr'), __param(0, (0, _common.Inject)(_gdpr.GdprService)), __metadata("design:paramtypes", [Object])], GdprController);