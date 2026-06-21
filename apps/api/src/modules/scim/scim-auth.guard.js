"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScimAuthGuard = void 0;
var _common = require("@nestjs/common");
var bcrypt = _interopRequireWildcard(require("bcrypt"));
var _prisma = require("../database/prisma.service");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
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
let ScimAuthGuard = exports.ScimAuthGuard = class ScimAuthGuard {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      throw new _common.UnauthorizedException('Missing X-Tenant-ID header');
    }
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new _common.UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });
    if (!tenant) {
      throw new _common.UnauthorizedException('Tenant not found');
    }
    const settings = tenant.settings ?? {};
    const storedHash = settings['scimTokenHash'];
    if (!storedHash) {
      throw new _common.UnauthorizedException('SCIM not configured for this tenant');
    }
    const valid = await bcrypt.compare(token, storedHash);
    if (!valid) {
      throw new _common.UnauthorizedException('Invalid SCIM token');
    }
    return true;
  }
};
exports.ScimAuthGuard = ScimAuthGuard = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], ScimAuthGuard);