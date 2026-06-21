"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluginSandboxService = void 0;
var _common = require("@nestjs/common");
var _pluginPermissions = require("../domain/plugin-permissions");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unsafe-argument */

let PluginSandboxService = exports.PluginSandboxService = class PluginSandboxService {
  KNOWN_PERMISSIONS = new Set(Object.keys(_pluginPermissions.PLUGIN_PERMISSION_META));
  DISALLOWED_FLAGS = new Set(['allow-same-origin', 'allow-top-navigation', 'allow-top-navigation-by-user-activation']);
  validateManifest(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new _common.BadRequestException('Plugin manifest must be a JSON object');
    }
    const manifest = raw;
    if (typeof manifest['version'] !== 'string' || !manifest['version'].trim()) {
      throw new _common.BadRequestException('Manifest must declare a version string');
    }
    if (typeof manifest['entrypoint'] !== 'string' || !manifest['entrypoint'].trim()) {
      throw new _common.BadRequestException('Manifest must declare an entrypoint');
    }
    this.assertSafeEntrypoint(manifest['entrypoint']);
    if (!Array.isArray(manifest['permissions'])) {
      throw new _common.BadRequestException('Manifest must declare a permissions array');
    }
    const unknownPerms = manifest['permissions'].filter(p => !this.KNOWN_PERMISSIONS.has(p));
    if (unknownPerms.length) {
      throw new _common.BadRequestException(`Unknown permissions: ${unknownPerms.join(', ')}`);
    }
    if (manifest['sandboxFlags'] !== undefined) {
      if (!Array.isArray(manifest['sandboxFlags'])) {
        throw new _common.BadRequestException('sandboxFlags must be an array');
      }
      this.assertSafeSandboxFlags(manifest['sandboxFlags']);
    }
    return manifest;
  }
  checkRequiredPermissions(manifest, required) {
    const granted = new Set(manifest.permissions);
    const missing = required.filter(p => !granted.has(p));
    if (missing.length) {
      throw new _common.BadRequestException(`Plugin is missing required permissions: ${missing.join(', ')}`);
    }
  }
  buildSandboxAttribute(manifest) {
    const base = ['allow-scripts'];
    const extras = (manifest.sandboxFlags ?? []).filter(f => _pluginPermissions.ALLOWED_SANDBOX_FLAGS.includes(f));
    return [...new Set([...base, ...extras])].join(' ');
  }
  buildCsp(manifest) {
    const permissions = manifest.permissions;
    const hasStorage = permissions.includes('access:storage');
    const connectSrc = hasStorage ? "'self' blob:" : "'self'";
    const imgSrc = ["'self'", 'data:', 'https:'];
    if (hasStorage) {
      imgSrc.push('blob:');
    }
    return ["default-src 'none'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'", `connect-src ${connectSrc}`, `img-src ${imgSrc.join(' ')}`, "font-src 'self'", "frame-ancestors 'self'"].join('; ');
  }
  assertSafeEntrypoint(entrypoint) {
    if (/^https?:\/\//i.test(entrypoint)) {
      // External URLs must be from known CDN allowlist — block by default
      throw new _common.BadRequestException('External entrypoint URLs are not allowed. Use a relative path.');
    }
    // Prevent path traversal
    if (entrypoint.includes('..')) {
      throw new _common.BadRequestException('Entrypoint path must not contain ".."');
    }
  }
  assertSafeSandboxFlags(flags) {
    const dangerous = flags.filter(f => this.DISALLOWED_FLAGS.has(f));
    if (dangerous.length) {
      throw new _common.BadRequestException(`Dangerous sandbox flags are not allowed: ${dangerous.join(', ')}. ` + 'In particular "allow-same-origin" would bypass the sandbox entirely.');
    }
    const unknown = flags.filter(f => !_pluginPermissions.ALLOWED_SANDBOX_FLAGS.includes(f));
    if (unknown.length) {
      throw new _common.BadRequestException(`Unrecognised sandbox flags: ${unknown.join(', ')}`);
    }
  }
};
exports.PluginSandboxService = PluginSandboxService = __decorate([(0, _common.Injectable)()], PluginSandboxService);