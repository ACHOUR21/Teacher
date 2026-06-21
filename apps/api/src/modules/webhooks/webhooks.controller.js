"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebhooksController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
var _webhooks = require("./webhooks.service");
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
let WebhooksController = exports.WebhooksController = class WebhooksController {
  constructor(webhooksService) {
    this.webhooksService = webhooksService;
  }
  registerEndpoint(user, dto) {
    return this.webhooksService.registerEndpoint(user.tenantId, dto);
  }
  listEndpoints(user) {
    return this.webhooksService.listEndpoints(user.tenantId);
  }
  deleteEndpoint(user, id) {
    return this.webhooksService.deleteEndpoint(user.tenantId, id);
  }
  testEndpoint(user, id) {
    return this.webhooksService.testEndpoint(user.tenantId, id);
  }
};
__decorate([(0, _common.Post)('endpoints'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.CREATED), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], WebhooksController.prototype, "registerEndpoint", null);
__decorate([(0, _common.Get)('endpoints'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], WebhooksController.prototype, "listEndpoints", null);
__decorate([(0, _common.Delete)('endpoints/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], WebhooksController.prototype, "deleteEndpoint", null);
__decorate([(0, _common.Post)('test/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.ACCEPTED), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], WebhooksController.prototype, "testEndpoint", null);
exports.WebhooksController = WebhooksController = __decorate([(0, _swagger.ApiTags)('webhooks'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('webhooks'), __param(0, (0, _common.Inject)(_webhooks.WebhooksService)), __metadata("design:paramtypes", [Object])], WebhooksController);