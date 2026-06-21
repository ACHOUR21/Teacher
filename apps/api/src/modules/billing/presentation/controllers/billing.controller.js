"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BillingController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _public = require("../../../core/decorators/public.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _billing = require("../../billing.service");
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
var _a, _b, _c, _d, _e;
class SubscribeDto {
  plan;
  successUrl;
  cancelUrl;
}
__decorate([(0, _swagger.ApiProperty)({
  enum: _client.SubscriptionPlan
}), (0, _classValidator.IsEnum)(_client.SubscriptionPlan), __metadata("design:type", typeof (_a = typeof _client.SubscriptionPlan !== "undefined" && _client.SubscriptionPlan) === "function" ? _a : Object)], SubscribeDto.prototype, "plan", void 0);
__decorate([(0, _swagger.ApiProperty)({
  example: 'https://app.eduai.io/billing?success=1'
}), (0, _classValidator.IsUrl)(), __metadata("design:type", String)], SubscribeDto.prototype, "successUrl", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'https://app.eduai.io/billing'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsUrl)(), __metadata("design:type", String)], SubscribeDto.prototype, "cancelUrl", void 0);
class PortalSessionDto {
  returnUrl;
}
__decorate([(0, _swagger.ApiProperty)({
  example: 'https://app.eduai.io/billing'
}), (0, _classValidator.IsString)(), __metadata("design:type", String)], PortalSessionDto.prototype, "returnUrl", void 0);
class ApplyCouponDto {
  couponCode;
}
__decorate([(0, _swagger.ApiProperty)({
  example: 'SAVE20'
}), (0, _classValidator.IsString)(), __metadata("design:type", String)], ApplyCouponDto.prototype, "couponCode", void 0);
let BillingController = exports.BillingController = class BillingController {
  constructor(billingService) {
    this.billingService = billingService;
  }
  subscribe(tenantId, user, dto) {
    return this.billingService.subscribe(tenantId, dto.plan, user.id, dto.successUrl, dto.cancelUrl ?? dto.successUrl);
  }
  async createPortal(tenantId, dto) {
    const url = await this.billingService.createPortalSession(tenantId, dto.returnUrl);
    return {
      url
    };
  }
  cancel(tenantId) {
    return this.billingService.cancelSubscription(tenantId);
  }
  applyCoupon(tenantId, dto) {
    return this.billingService.applyCoupon(tenantId, dto.couponCode);
  }
  getSubscription(tenantId) {
    return this.billingService.getCurrentSubscription(tenantId);
  }
  getInvoices(tenantId, page = 1, limit = 20) {
    return this.billingService.getInvoices(tenantId, +page, +limit);
  }
  getAnalytics(tenantId) {
    return this.billingService.getRevenueAnalytics(tenantId);
  }
  createPayPalOrder(tenantId, dto) {
    return this.billingService.createPayPalOrder(tenantId, dto.plan);
  }
  capturePayPalOrder(tenantId, orderId, dto) {
    return this.billingService.capturePayPalOrder(tenantId, orderId, dto.plan);
  }
  async handleWebhook(req, signature) {
    if (!req.rawBody) {
      throw new Error('Raw body not available');
    }
    await this.billingService.handleStripeWebhook(req.rawBody, signature);
    return {
      received: true
    };
  }
};
__decorate([(0, _common.Post)('subscribe'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create Stripe Checkout Session to subscribe / upgrade plan'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object, SubscribeDto]), __metadata("design:returntype", void 0)], BillingController.prototype, "subscribe", null);
__decorate([(0, _common.Post)('portal'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create Stripe billing portal session'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, PortalSessionDto]), __metadata("design:returntype", Promise)], BillingController.prototype, "createPortal", null);
__decorate([(0, _common.Post)('cancel'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Schedule subscription cancellation at period end'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], BillingController.prototype, "cancel", null);
__decorate([(0, _common.Post)('coupon/apply'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Apply a coupon code to current subscription'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, ApplyCouponDto]), __metadata("design:returntype", void 0)], BillingController.prototype, "applyCoupon", null);
__decorate([(0, _common.Get)('subscription'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.TEACHER, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get current subscription and recent invoices'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], BillingController.prototype, "getSubscription", null);
__decorate([(0, _common.Get)('invoices'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List billing invoices (paginated)'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('page')), __param(2, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, Object]), __metadata("design:returntype", void 0)], BillingController.prototype, "getInvoices", null);
__decorate([(0, _common.Get)('analytics'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Revenue analytics: MRR, ARR, churn, monthly breakdown'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], BillingController.prototype, "getAnalytics", null);
__decorate([(0, _common.Post)('paypal/order'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create PayPal order (stub)'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof Pick !== "undefined" && Pick) === "function" ? _c : Object]), __metadata("design:returntype", void 0)], BillingController.prototype, "createPayPalOrder", null);
__decorate([(0, _common.Post)('paypal/capture/:orderId'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Capture PayPal order (stub)'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Param)('orderId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_d = typeof Pick !== "undefined" && Pick) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], BillingController.prototype, "capturePayPalOrder", null);
__decorate([(0, _public.Public)(), (0, _common.Post)('webhook'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Stripe webhook endpoint (public, signature-verified)'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Headers)('stripe-signature')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_e = typeof _common.RawBodyRequest !== "undefined" && _common.RawBodyRequest) === "function" ? _e : Object, String]), __metadata("design:returntype", Promise)], BillingController.prototype, "handleWebhook", null);
exports.BillingController = BillingController = __decorate([(0, _swagger.ApiTags)('Billing'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('billing'), __param(0, (0, _common.Inject)(_billing.BillingService)), __metadata("design:paramtypes", [Object])], BillingController);