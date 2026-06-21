"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Public = exports.IS_PUBLIC_KEY = void 0;
var _common = require("@nestjs/common");
const IS_PUBLIC_KEY = exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, _common.SetMetadata)(IS_PUBLIC_KEY, true);
exports.Public = Public;