"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MarketplaceController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _public = require("../../../core/decorators/public.decorator");
var _featureFlags = require("../../../feature-flags/feature-flags.constants");
var _featureFlag = require("../../../feature-flags/feature-flag.guard");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _marketplace = require("../../marketplace.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

class AddReviewDto {
  rating;
  comment;
}
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), (0, _classValidator.Max)(5), __metadata("design:type", Number)], AddReviewDto.prototype, "rating", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], AddReviewDto.prototype, "comment", void 0);
class PurchaseCourseDto {
  successUrl;
  cancelUrl;
}
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], PurchaseCourseDto.prototype, "successUrl", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], PurchaseCourseDto.prototype, "cancelUrl", void 0);
let MarketplaceController = exports.MarketplaceController = class MarketplaceController {
  constructor(marketplaceService) {
    this.marketplaceService = marketplaceService;
  }
  browse(search, category, level, maxPrice, minRating, sortBy, page = 1, limit = 20) {
    return this.marketplaceService.browseCourses({
      search,
      category,
      level,
      maxPrice: maxPrice ? +maxPrice : undefined,
      minRating: minRating ? +minRating : undefined,
      sortBy,
      page: +page,
      limit: +limit
    });
  }
  categories() {
    return this.marketplaceService.getCategories();
  }
  purchase(courseId, user, dto) {
    return this.marketplaceService.purchaseCourse(user.id, courseId, dto.successUrl, dto.cancelUrl);
  }
  addReview(courseId, user, dto) {
    return this.marketplaceService.addReview(user.id, courseId, dto.rating, dto.comment);
  }
  reviews(courseId, page = 1) {
    return this.marketplaceService.getCourseReviews(courseId, +page);
  }
};
__decorate([(0, _common.Get)('courses'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Browse marketplace courses'
}), __param(0, (0, _common.Query)('search')), __param(1, (0, _common.Query)('category')), __param(2, (0, _common.Query)('level')), __param(3, (0, _common.Query)('maxPrice')), __param(4, (0, _common.Query)('minRating')), __param(5, (0, _common.Query)('sortBy')), __param(6, (0, _common.Query)('page')), __param(7, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String, Number, Number, String, Object, Object]), __metadata("design:returntype", void 0)], MarketplaceController.prototype, "browse", null);
__decorate([(0, _common.Get)('categories'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Get course categories with counts'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], MarketplaceController.prototype, "categories", null);
__decorate([(0, _common.Post)('courses/:id/purchase'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: 'Purchase or enroll in a course. Paid courses return checkoutUrl for Stripe redirect.'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, PurchaseCourseDto]), __metadata("design:returntype", void 0)], MarketplaceController.prototype, "purchase", null);
__decorate([(0, _common.Post)('courses/:id/reviews'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: 'Add a course review'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, AddReviewDto]), __metadata("design:returntype", void 0)], MarketplaceController.prototype, "addReview", null);
__decorate([(0, _common.Get)('courses/:id/reviews'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Get course reviews'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Query)('page')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], MarketplaceController.prototype, "reviews", null);
exports.MarketplaceController = MarketplaceController = __decorate([(0, _swagger.ApiTags)('Marketplace'), (0, _common.UseGuards)(_featureFlag.FeatureFlagGuard), (0, _featureFlag.RequireFeature)(_featureFlags.FEATURE_FLAGS.MARKETPLACE), (0, _common.Controller)('marketplace'), __param(0, (0, _common.Inject)(_marketplace.MarketplaceService)), __metadata("design:paramtypes", [Object])], MarketplaceController);