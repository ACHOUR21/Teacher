"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScimController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _scimAuth = require("./scim-auth.guard");
var _scim = require("./scim.service");
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
let ScimController = exports.ScimController = class ScimController {
  constructor(scimService) {
    this.scimService = scimService;
  }
  tenantId(req) {
    return req.headers['x-tenant-id'] ?? 'default';
  }
  // ─── ServiceProviderConfig ────────────────────────────────────────────────
  getServiceProviderConfig() {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      patch: {
        supported: true
      },
      bulk: {
        supported: false,
        maxOperations: 0,
        maxPayloadSize: 0
      },
      filter: {
        supported: true,
        maxResults: 200
      },
      changePassword: {
        supported: false
      },
      sort: {
        supported: false
      },
      authenticationSchemes: [{
        type: 'oauthbearertoken',
        name: 'OAuth Bearer Token',
        description: 'Authentication using an OAuth Bearer Token'
      }]
    };
  }
  getSchemas() {
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: 0,
      Resources: []
    };
  }
  // ─── Users ────────────────────────────────────────────────────────────────
  listUsers(req, filter, startIndex = '1', count = '100') {
    return this.scimService.listUsers(this.tenantId(req), filter, parseInt(startIndex, 10), parseInt(count, 10));
  }
  createUser(req, dto) {
    return this.scimService.createUser(this.tenantId(req), dto);
  }
  getUser(req, id) {
    return this.scimService.getUser(this.tenantId(req), id);
  }
  replaceUser(req, id, dto) {
    return this.scimService.replaceUser(this.tenantId(req), id, dto);
  }
  patchUser(req, id, operations) {
    return this.scimService.patchUser(this.tenantId(req), id, operations ?? []);
  }
  deleteUser(req, id) {
    return this.scimService.deleteUser(this.tenantId(req), id);
  }
  // ─── Groups ───────────────────────────────────────────────────────────────
  listGroups(req, filter, startIndex = '1', count = '100') {
    return this.scimService.listGroups(this.tenantId(req), filter, parseInt(startIndex, 10), parseInt(count, 10));
  }
  createGroup(req, dto) {
    return this.scimService.createGroup(this.tenantId(req), dto);
  }
  getGroup(req, id) {
    return this.scimService.getGroup(this.tenantId(req), id);
  }
  replaceGroup(req, id, dto) {
    return this.scimService.replaceGroup(this.tenantId(req), id, dto);
  }
  deleteGroup(req, id) {
    return this.scimService.deleteGroup(this.tenantId(req), id);
  }
  // ─── Token management ─────────────────────────────────────────────────────
  async generateToken(req, res) {
    const token = await this.scimService.generateScimToken(this.tenantId(req));
    return res.json({
      token,
      message: 'Store this token securely — it will not be shown again.'
    });
  }
};
__decorate([(0, _common.Get)('ServiceProviderConfig'), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], ScimController.prototype, "getServiceProviderConfig", null);
__decorate([(0, _common.Get)('Schemas'), (0, _swagger.ApiExcludeEndpoint)(), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], ScimController.prototype, "getSchemas", null);
__decorate([(0, _common.Get)('Users'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Query)('filter')), __param(2, (0, _common.Query)('startIndex')), __param(3, (0, _common.Query)('count')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object, Object]), __metadata("design:returntype", void 0)], ScimController.prototype, "listUsers", null);
__decorate([(0, _common.Post)('Users'), (0, _common.HttpCode)(_common.HttpStatus.CREATED), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], ScimController.prototype, "createUser", null);
__decorate([(0, _common.Get)('Users/:id'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ScimController.prototype, "getUser", null);
__decorate([(0, _common.Put)('Users/:id'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], ScimController.prototype, "replaceUser", null);
__decorate([(0, _common.Patch)('Users/:id'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __param(2, (0, _common.Body)('Operations')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Array]), __metadata("design:returntype", void 0)], ScimController.prototype, "patchUser", null);
__decorate([(0, _common.Delete)('Users/:id'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ScimController.prototype, "deleteUser", null);
__decorate([(0, _common.Get)('Groups'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Query)('filter')), __param(2, (0, _common.Query)('startIndex')), __param(3, (0, _common.Query)('count')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object, Object]), __metadata("design:returntype", void 0)], ScimController.prototype, "listGroups", null);
__decorate([(0, _common.Post)('Groups'), (0, _common.HttpCode)(_common.HttpStatus.CREATED), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], ScimController.prototype, "createGroup", null);
__decorate([(0, _common.Get)('Groups/:id'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ScimController.prototype, "getGroup", null);
__decorate([(0, _common.Put)('Groups/:id'), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], ScimController.prototype, "replaceGroup", null);
__decorate([(0, _common.Delete)('Groups/:id'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ScimController.prototype, "deleteGroup", null);
__decorate([(0, _common.Post)('token'), (0, _common.HttpCode)(_common.HttpStatus.CREATED), __param(0, (0, _common.Req)()), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", Promise)], ScimController.prototype, "generateToken", null);
exports.ScimController = ScimController = __decorate([(0, _swagger.ApiTags)('scim'), (0, _common.UseGuards)(_scimAuth.ScimAuthGuard), (0, _common.Controller)('scim/v2'), __param(0, (0, _common.Inject)(_scim.ScimService)), __metadata("design:paramtypes", [Object])], ScimController);