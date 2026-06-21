"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RegisterDto = exports.CreateTenantRegisterDto = void 0;
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
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
var _a, _b;
class RegisterDto {
  firstName;
  lastName;
  email;
  password;
  phone;
  role;
}
exports.RegisterDto = RegisterDto;
__decorate([(0, _swagger.ApiProperty)({
  example: 'John'
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(1), (0, _classValidator.MaxLength)(100), __metadata("design:type", String)], RegisterDto.prototype, "firstName", void 0);
__decorate([(0, _swagger.ApiProperty)({
  example: 'Doe'
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(1), (0, _classValidator.MaxLength)(100), __metadata("design:type", String)], RegisterDto.prototype, "lastName", void 0);
__decorate([(0, _swagger.ApiProperty)({
  example: 'john.doe@example.com'
}), (0, _classValidator.IsEmail)(), __metadata("design:type", String)], RegisterDto.prototype, "email", void 0);
__decorate([(0, _swagger.ApiProperty)({
  example: 'SecureP@ss123',
  minLength: 8
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(8), (0, _classValidator.MaxLength)(128), (0, _classValidator.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
  message: 'Password must contain uppercase, lowercase, number and special character'
}), __metadata("design:type", String)], RegisterDto.prototype, "password", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '+1234567890'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], RegisterDto.prototype, "phone", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  enum: _client.UserRole,
  default: _client.UserRole.STUDENT
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsEnum)(_client.UserRole), __metadata("design:type", typeof (_a = typeof _client.UserRole !== "undefined" && _client.UserRole) === "function" ? _a : Object)], RegisterDto.prototype, "role", void 0);
class CreateTenantRegisterDto extends RegisterDto {
  tenantName;
  tenantSlug;
  tenantType;
}
exports.CreateTenantRegisterDto = CreateTenantRegisterDto;
__decorate([(0, _swagger.ApiProperty)({
  example: 'Acme School'
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(2), (0, _classValidator.MaxLength)(200), __metadata("design:type", String)], CreateTenantRegisterDto.prototype, "tenantName", void 0);
__decorate([(0, _swagger.ApiProperty)({
  example: 'acme-school'
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(2), (0, _classValidator.MaxLength)(100), (0, _classValidator.Matches)(/^[a-z0-9-]+$/, {
  message: 'Slug must be lowercase alphanumeric with hyphens'
}), __metadata("design:type", String)], CreateTenantRegisterDto.prototype, "tenantSlug", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  enum: _client.TenantType,
  default: _client.TenantType.SCHOOL
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsEnum)(_client.TenantType), __metadata("design:type", typeof (_b = typeof _client.TenantType !== "undefined" && _client.TenantType) === "function" ? _b : Object)], CreateTenantRegisterDto.prototype, "tenantType", void 0);