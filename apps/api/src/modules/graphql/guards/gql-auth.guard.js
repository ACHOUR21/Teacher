"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GqlAuthGuard = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _passport = require("@nestjs/passport");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

let GqlAuthGuard = exports.GqlAuthGuard = class GqlAuthGuard extends (0, _passport.AuthGuard)('jwt') {
  getRequest(context) {
    const ctx = _graphql.GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
};
exports.GqlAuthGuard = GqlAuthGuard = __decorate([(0, _common.Injectable)()], GqlAuthGuard);