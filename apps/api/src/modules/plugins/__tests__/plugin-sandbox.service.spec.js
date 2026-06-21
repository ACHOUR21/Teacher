"use strict";

var _common = require("@nestjs/common");
var _pluginSandbox = require("../application/plugin-sandbox.service");
const validManifest = {
  version: '1.0.0',
  entrypoint: '/plugins/my-plugin/index.html',
  permissions: ['read:courses', 'read:grades']
};
describe('PluginSandboxService', () => {
  let service;
  beforeEach(() => {
    service = new _pluginSandbox.PluginSandboxService();
  });
  // ── validateManifest ──────────────────────────────────────────────────────
  describe('validateManifest', () => {
    it('accepts a valid manifest', () => {
      expect(() => service.validateManifest(validManifest)).not.toThrow();
    });
    it('returns the typed manifest object', () => {
      const result = service.validateManifest(validManifest);
      expect(result.version).toBe('1.0.0');
      expect(result.permissions).toEqual(['read:courses', 'read:grades']);
    });
    it('throws when manifest is null', () => {
      expect(() => service.validateManifest(null)).toThrow(_common.BadRequestException);
    });
    it('throws when manifest is a string', () => {
      expect(() => service.validateManifest('bad')).toThrow(_common.BadRequestException);
    });
    it('throws when version is missing', () => {
      const {
        version: _,
        ...rest
      } = validManifest;
      expect(() => service.validateManifest(rest)).toThrow('version');
    });
    it('throws when version is empty string', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        version: '   '
      })).toThrow('version');
    });
    it('throws when entrypoint is missing', () => {
      const {
        entrypoint: _,
        ...rest
      } = validManifest;
      expect(() => service.validateManifest(rest)).toThrow('entrypoint');
    });
    it('throws when entrypoint is an external http URL', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        entrypoint: 'http://evil.com/xss.js'
      })).toThrow('External entrypoint');
    });
    it('throws when entrypoint contains path traversal', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        entrypoint: '../../etc/passwd'
      })).toThrow('".."');
    });
    it('throws when permissions is not an array', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        permissions: 'read:courses'
      })).toThrow('permissions array');
    });
    it('throws when permissions contains unknown permission', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        permissions: ['read:courses', 'destroy:everything']
      })).toThrow('Unknown permissions');
    });
    it('accepts an empty permissions array', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        permissions: []
      })).not.toThrow();
    });
    it('throws when sandboxFlags is not an array', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        sandboxFlags: 'allow-scripts'
      })).toThrow('sandboxFlags');
    });
    it('throws for dangerous flag allow-same-origin', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        sandboxFlags: ['allow-same-origin']
      })).toThrow('allow-same-origin');
    });
    it('throws for dangerous flag allow-top-navigation', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        sandboxFlags: ['allow-top-navigation']
      })).toThrow('allow-top-navigation');
    });
    it('throws for unknown sandbox flag', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        sandboxFlags: ['allow-pointer-lock']
      })).toThrow('Unrecognised sandbox flags');
    });
    it('accepts valid optional sandbox flags', () => {
      expect(() => service.validateManifest({
        ...validManifest,
        sandboxFlags: ['allow-forms', 'allow-popups']
      })).not.toThrow();
    });
  });
  // ── checkRequiredPermissions ──────────────────────────────────────────────
  describe('checkRequiredPermissions', () => {
    it('passes when all required permissions are declared', () => {
      expect(() => service.checkRequiredPermissions(validManifest, ['read:courses'])).not.toThrow();
    });
    it('throws when a required permission is missing', () => {
      expect(() => service.checkRequiredPermissions(validManifest, ['write:grades'])).toThrow('write:grades');
    });
    it('passes with empty required array', () => {
      expect(() => service.checkRequiredPermissions(validManifest, [])).not.toThrow();
    });
  });
  // ── buildSandboxAttribute ────────────────────────────────────────────────
  describe('buildSandboxAttribute', () => {
    it('always includes allow-scripts', () => {
      expect(service.buildSandboxAttribute(validManifest)).toContain('allow-scripts');
    });
    it('does not include allow-same-origin', () => {
      const result = service.buildSandboxAttribute(validManifest);
      expect(result).not.toContain('allow-same-origin');
    });
    it('appends extra flags from manifest', () => {
      const manifest = {
        ...validManifest,
        sandboxFlags: ['allow-forms']
      };
      expect(service.buildSandboxAttribute(manifest)).toContain('allow-forms');
    });
    it('deduplicates repeated flags', () => {
      const manifest = {
        ...validManifest,
        sandboxFlags: ['allow-scripts']
      };
      const result = service.buildSandboxAttribute(manifest);
      expect(result.split(' ').filter(f => f === 'allow-scripts').length).toBe(1);
    });
  });
  // ── buildCsp ─────────────────────────────────────────────────────────────
  describe('buildCsp', () => {
    it('restricts default-src to none', () => {
      expect(service.buildCsp(validManifest)).toContain("default-src 'none'");
    });
    it('includes frame-ancestors self to block clickjacking', () => {
      expect(service.buildCsp(validManifest)).toContain("frame-ancestors 'self'");
    });
    it("uses 'self' for connect-src when access:storage is not granted", () => {
      const result = service.buildCsp(validManifest);
      expect(result).toContain("connect-src 'self'");
      expect(result).not.toContain('blob:');
    });
    it('adds blob: to connect-src when access:storage is granted', () => {
      const manifest = {
        ...validManifest,
        permissions: ['access:storage']
      };
      expect(service.buildCsp(manifest)).toContain('blob:');
    });
  });
});