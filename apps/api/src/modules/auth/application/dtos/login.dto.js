"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResetPasswordDto = exports.LoginDto = exports.ForgotPasswordDto = void 0;
var _swagger = require("@nestjs/swagger");
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
class LoginDto {
  email;
  password;
  deviceId;
  deviceName;
}
exports.LoginDto = LoginDto;
__decorate([(0, _swagger.ApiProperty)({
  example: 'john.doe@example.com'
}), (0, _classValidator.IsEmail)(), __metadata("design:type", String)], LoginDto.prototype, "email", void 0);
__decorate([(0, _swagger.ApiProperty)({
  example: 'SecureP@ss123'
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(1), __metadata("design:type", String)], LoginDto.prototype, "password", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'device-uuid-123'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], LoginDto.prototype, "deviceId", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 'iPhone 14'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], LoginDto.prototype, "deviceName", void 0);
class ForgotPasswordDto {
  email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([(0, _swagger.ApiProperty)({
  example: 'john.doe@example.com'
}), (0, _classValidator.IsEmail)(), __metadata("design:type", String)], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
  token;
  newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], ResetPasswordDto.prototype, "token", void 0);
__decorate([(0, _swagger.ApiProperty)({
  minLength: 8
}), (0, _classValidator.IsString)(), (0, _classValidator.MinLength)(8), __metadata("design:type", String)], ResetPasswordDto.prototype, "newPassword", void 0);