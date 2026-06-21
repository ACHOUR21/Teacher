"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Roles = exports.ROLES_KEY = void 0;
var _common = require("@nestjs/common");
const ROLES_KEY = exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, _common.SetMetadata)(ROLES_KEY, roles);
exports.Roles = Roles;