"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateBrandingDto = void 0;
var _classValidator = require("class-validator");
var _swagger = require("@nestjs/swagger");
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
class UpdateBrandingDto {
  logoUrl;
  faviconUrl;
  primaryColor;
  secondaryColor;
  accentColor;
  fontFamily;
  tagline;
  customCss;
}
exports.UpdateBrandingDto = UpdateBrandingDto;
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'https://cdn.eduai.example.com/tenants/t-1/logo'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "logoUrl", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'https://cdn.eduai.example.com/tenants/t-1/favicon'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "faviconUrl", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '#6366f1'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsHexColor)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "primaryColor", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '#8b5cf6'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsHexColor)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "secondaryColor", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '#06b6d4'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsHexColor)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "accentColor", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'Inter'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "fontFamily", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'Empowering learners everywhere'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "tagline", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '.logo { width: 120px; }'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateBrandingDto.prototype, "customCss", void 0);