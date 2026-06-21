"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QuizzesController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
var _prisma = require("../database/prisma.service");
var _quizzes = require("./quizzes.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
let QuizzesController = exports.QuizzesController = class QuizzesController {
  constructor(quizzesService, prisma) {
    this.quizzesService = quizzesService;
    this.prisma = prisma;
  }
  getByLesson(lessonId) {
    return this.quizzesService.getByLesson(lessonId);
  }
  getById(id) {
    return this.quizzesService.getById(id);
  }
  async create(user, dto) {
    if (user.role === _client.UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          userId: user.id
        }
      });
      if (!teacher) {
        throw new _common.NotFoundException('Teacher profile not found');
      }
    }
    return this.quizzesService.create(dto);
  }
  async update(id, user, dto) {
    if (user.role === _client.UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          userId: user.id
        }
      });
      if (!teacher) {
        throw new _common.NotFoundException('Teacher profile not found');
      }
    }
    return this.quizzesService.update(id, dto);
  }
  async delete(id, user) {
    if (user.role === _client.UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          userId: user.id
        }
      });
      if (!teacher) {
        throw new _common.NotFoundException('Teacher profile not found');
      }
    }
    return this.quizzesService.deleteQuiz(id);
  }
  async submitAttempt(quizId, user, dto) {
    return this.quizzesService.submitAttempt(quizId, user.id, dto.answers);
  }
  getMyAttempts(quizId, user) {
    return this.quizzesService.getMyAttempts(quizId, user.id);
  }
  async getResults(quizId, user) {
    if (user.role === _client.UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          userId: user.id
        }
      });
      if (!teacher) {
        throw new _common.NotFoundException('Teacher profile not found');
      }
    }
    return this.quizzesService.getResults(quizId);
  }
};
__decorate([(0, _common.Get)('lesson/:lessonId'), (0, _swagger.ApiOperation)({
  summary: 'Get quiz by lesson ID'
}), __param(0, (0, _common.Param)('lessonId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], QuizzesController.prototype, "getByLesson", null);
__decorate([(0, _common.Get)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Get quiz by ID with attempt count'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], QuizzesController.prototype, "getById", null);
__decorate([(0, _common.Post)(), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a quiz'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object, typeof (_b = typeof _quizzes.CreateQuizDto !== "undefined" && _quizzes.CreateQuizDto) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], QuizzesController.prototype, "create", null);
__decorate([(0, _common.Patch)(':id'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update a quiz'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, typeof (_d = typeof _quizzes.UpdateQuizDto !== "undefined" && _quizzes.UpdateQuizDto) === "function" ? _d : Object]), __metadata("design:returntype", Promise)], QuizzesController.prototype, "update", null);
__decorate([(0, _common.Delete)(':id'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a quiz'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object]), __metadata("design:returntype", Promise)], QuizzesController.prototype, "delete", null);
__decorate([(0, _common.Post)(':id/attempt'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Submit a quiz attempt'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_f = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _f : Object, typeof (_g = typeof _quizzes.SubmitAttemptDto !== "undefined" && _quizzes.SubmitAttemptDto) === "function" ? _g : Object]), __metadata("design:returntype", Promise)], QuizzesController.prototype, "submitAttempt", null);
__decorate([(0, _common.Get)(':id/my-attempts'), (0, _swagger.ApiOperation)({
  summary: 'Get my attempts for a quiz'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_h = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _h : Object]), __metadata("design:returntype", void 0)], QuizzesController.prototype, "getMyAttempts", null);
__decorate([(0, _common.Get)(':id/results'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get all attempts for a quiz (teacher/admin only)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_j = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _j : Object]), __metadata("design:returntype", Promise)], QuizzesController.prototype, "getResults", null);
exports.QuizzesController = QuizzesController = __decorate([(0, _swagger.ApiTags)('Quizzes'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('quizzes'), __param(0, (0, _common.Inject)(_quizzes.QuizzesService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], QuizzesController);