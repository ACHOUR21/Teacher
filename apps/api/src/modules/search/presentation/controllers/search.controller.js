"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SearchController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _public = require("../../../core/decorators/public.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _search = require("../../search.service");
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
let SearchController = exports.SearchController = class SearchController {
  constructor(searchService) {
    this.searchService = searchService;
  }
  // ── Unified search: GET /search?q=...&type=courses|users|all ─────────────
  search(tenantId, query, type = 'all', page, limit) {
    const p = page ? +page : 1;
    const l = limit ? +limit : 20;
    if (type === 'courses') {
      return this.searchService.searchCourses(query, tenantId, {}, p, l);
    }
    if (type === 'users') {
      return this.searchService.searchUsers(query, tenantId, {}, p, l);
    }
    return this.searchService.searchAll(query, tenantId, l);
  }
  // ── Dedicated course search (public) ─────────────────────────────────────
  searchCourses(tenantId, query, category, level, page, limit) {
    return this.searchService.searchCourses(query, tenantId, {
      category,
      level
    }, page ? +page : 1, limit ? +limit : 20);
  }
  // ── Dedicated user search (privileged) ───────────────────────────────────
  searchUsers(tenantId, query, role, page, limit) {
    return this.searchService.searchUsers(query, tenantId, {
      role
    }, page ? +page : 1, limit ? +limit : 20);
  }
  // ── Exam search ──────────────────────────────────────────────────────────
  searchExams(tenantId, query, difficulty, page, limit) {
    return this.searchService.searchExams(query, tenantId, {
      difficulty
    }, page ? +page : 1, limit ? +limit : 20);
  }
  // ── Multi-entity search ───────────────────────────────────────────────────
  searchAll(tenantId, query, limit) {
    return this.searchService.searchAll(query, tenantId, limit ? +limit : 5);
  }
  // ── Autocomplete suggestions ──────────────────────────────────────────────
  suggest(tenantId, query) {
    return this.searchService.suggest(query, tenantId);
  }
  // ── Health check ─────────────────────────────────────────────────────────
  health() {
    return this.searchService.checkHealth();
  }
  // ── Manual re-index a course (ADMIN only) ─────────────────────────────────
  indexCourse(body) {
    return this.searchService.indexCourse({
      ...body,
      tags: body.tags ?? [],
      teacherName: body.teacherName ?? ''
    });
  }
};
__decorate([(0, _common.Get)(), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: 'Unified search across courses, users, or all entities'
}), (0, _swagger.ApiQuery)({
  name: 'q',
  required: true
}), (0, _swagger.ApiQuery)({
  name: 'type',
  required: false,
  enum: ['courses', 'users', 'all'],
  description: 'Entity type to search'
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __param(2, (0, _common.Query)('type')), __param(3, (0, _common.Query)('page')), __param(4, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String, Number, Number]), __metadata("design:returntype", void 0)], SearchController.prototype, "search", null);
__decorate([(0, _common.Get)('courses'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Full-text course search'
}), (0, _swagger.ApiQuery)({
  name: 'q',
  required: true
}), (0, _swagger.ApiQuery)({
  name: 'category',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'level',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __param(2, (0, _common.Query)('category')), __param(3, (0, _common.Query)('level')), __param(4, (0, _common.Query)('page')), __param(5, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String, String, Number, Number]), __metadata("design:returntype", void 0)], SearchController.prototype, "searchCourses", null);
__decorate([(0, _common.Get)('users'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Full-text user search'
}), (0, _swagger.ApiQuery)({
  name: 'q',
  required: true
}), (0, _swagger.ApiQuery)({
  name: 'role',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __param(2, (0, _common.Query)('role')), __param(3, (0, _common.Query)('page')), __param(4, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String, Number, Number]), __metadata("design:returntype", void 0)], SearchController.prototype, "searchUsers", null);
__decorate([(0, _common.Get)('exams'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: 'Full-text exam search'
}), (0, _swagger.ApiQuery)({
  name: 'q',
  required: true
}), (0, _swagger.ApiQuery)({
  name: 'difficulty',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __param(2, (0, _common.Query)('difficulty')), __param(3, (0, _common.Query)('page')), __param(4, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String, Number, Number]), __metadata("design:returntype", void 0)], SearchController.prototype, "searchExams", null);
__decorate([(0, _common.Get)('all'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: 'Unified search across courses, users, and exams'
}), (0, _swagger.ApiQuery)({
  name: 'q',
  required: true
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Results per entity type'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __param(2, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Number]), __metadata("design:returntype", void 0)], SearchController.prototype, "searchAll", null);
__decorate([(0, _common.Get)('suggest'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: 'Autocomplete suggestions for search input'
}), (0, _swagger.ApiQuery)({
  name: 'q',
  required: true
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SearchController.prototype, "suggest", null);
__decorate([(0, _common.Get)('health'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Check Elasticsearch connectivity'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SearchController.prototype, "health", null);
__decorate([(0, _common.Post)('index/course'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Manually re-index a course document'
}), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    required: ['id', 'title', 'tenantId'],
    properties: {
      id: {
        type: 'string'
      },
      title: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      category: {
        type: 'string'
      },
      tags: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      teacherName: {
        type: 'string'
      },
      tenantId: {
        type: 'string'
      },
      level: {
        type: 'string'
      },
      isPublished: {
        type: 'boolean'
      }
    }
  }
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], SearchController.prototype, "indexCourse", null);
exports.SearchController = SearchController = __decorate([(0, _swagger.ApiTags)('Search'), (0, _common.Controller)('search'), __param(0, (0, _common.Inject)(_search.SearchService)), __metadata("design:paramtypes", [Object])], SearchController);