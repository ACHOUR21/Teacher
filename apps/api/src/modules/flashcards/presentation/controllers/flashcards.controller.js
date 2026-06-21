"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FlashcardsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classTransformer = require("class-transformer");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _flashcards = require("../../flashcards.service");
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
var _a, _b, _c, _d, _e, _f;
class CardDto {
  front;
  back;
  hint;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CardDto.prototype, "front", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CardDto.prototype, "back", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CardDto.prototype, "hint", void 0);
class CreateDeckBodyDto {
  title;
  subject;
  topic;
  isPublic;
  cards;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateDeckBodyDto.prototype, "title", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateDeckBodyDto.prototype, "subject", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateDeckBodyDto.prototype, "topic", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], CreateDeckBodyDto.prototype, "isPublic", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  type: [CardDto]
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), (0, _classValidator.ValidateNested)({
  each: true
}), (0, _classTransformer.Type)(() => CardDto), __metadata("design:type", Array)], CreateDeckBodyDto.prototype, "cards", void 0);
class ReviewCardBodyDto {
  rating;
}
__decorate([(0, _swagger.ApiProperty)({
  description: 'SM-2 rating 0–5 (0=blackout, 5=perfect)'
}), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(0), (0, _classValidator.Max)(5), __metadata("design:type", Number)], ReviewCardBodyDto.prototype, "rating", void 0);
let FlashcardsController = exports.FlashcardsController = class FlashcardsController {
  constructor(flashcardsService) {
    this.flashcardsService = flashcardsService;
  }
  createDeck(tenantId, user, dto) {
    return this.flashcardsService.createDeck(tenantId, user.id, dto);
  }
  listDecks(tenantId, user) {
    return this.flashcardsService.listDecks(tenantId, user.id);
  }
  getDeck(deckId) {
    return this.flashcardsService.getDeck(deckId);
  }
  deleteDeck(deckId, user) {
    return this.flashcardsService.deleteDeck(deckId, user.id);
  }
  getDueCards(deckId, user) {
    return this.flashcardsService.getDueCards(deckId, user.id);
  }
  getStudyStats(deckId, user) {
    return this.flashcardsService.getStudyStats(deckId, user.id);
  }
  reviewCard(cardId, user, dto) {
    return this.flashcardsService.reviewCard(user.id, {
      cardId,
      rating: dto.rating
    });
  }
};
__decorate([(0, _common.Post)('decks'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Create a flashcard deck (manual or AI-generated)'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object, CreateDeckBodyDto]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "createDeck", null);
__decorate([(0, _common.Get)('decks'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'List accessible flashcard decks'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "listDecks", null);
__decorate([(0, _common.Get)('decks/:deckId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get deck with all cards'
}), __param(0, (0, _common.Param)('deckId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "getDeck", null);
__decorate([(0, _common.Delete)('decks/:deckId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a deck (creator only)'
}), __param(0, (0, _common.Param)('deckId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "deleteDeck", null);
__decorate([(0, _common.Get)('decks/:deckId/due'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get cards due for review today (spaced repetition)'
}), __param(0, (0, _common.Param)('deckId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "getDueCards", null);
__decorate([(0, _common.Get)('decks/:deckId/stats'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get study stats for a deck'
}), __param(0, (0, _common.Param)('deckId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "getStudyStats", null);
__decorate([(0, _common.Post)('cards/:cardId/review'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Submit SM-2 review for a card (rating 0–5)'
}), __param(0, (0, _common.Param)('cardId')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_f = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _f : Object, ReviewCardBodyDto]), __metadata("design:returntype", void 0)], FlashcardsController.prototype, "reviewCard", null);
exports.FlashcardsController = FlashcardsController = __decorate([(0, _swagger.ApiTags)('Flashcards'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('flashcards'), __param(0, (0, _common.Inject)(_flashcards.FlashcardsService)), __metadata("design:paramtypes", [Object])], FlashcardsController);