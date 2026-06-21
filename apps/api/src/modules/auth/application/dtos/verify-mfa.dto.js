"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VerifyMfaDto = exports.DisableMfaDto = void 0;
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
class VerifyMfaDto {
  token;
}
exports.VerifyMfaDto = VerifyMfaDto;
__decorate([(0, _swagger.ApiProperty)({
  example: '123456',
  description: 'TOTP code from authenticator app'
}), (0, _classValidator.IsString)(), (0, _classValidator.Length)(6, 6), __metadata("design:type", String)], VerifyMfaDto.prototype, "token", void 0);
class DisableMfaDto {
  token;
  password;
}
exports.DisableMfaDto = DisableMfaDto;
__decorate([(0, _swagger.ApiProperty)({
  example: '123456'
}), (0, _classValidator.IsString)(), (0, _classValidator.Length)(6, 6), __metadata("design:type", String)], DisableMfaDto.prototype, "token", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], DisableMfaDto.prototype, "password", void 0);