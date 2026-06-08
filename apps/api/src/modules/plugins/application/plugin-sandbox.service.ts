import { Injectable, BadRequestException } from '@nestjs/common';
import {
  PluginManifest,
  PluginPermission,
  PLUGIN_PERMISSION_META,
  ALLOWED_SANDBOX_FLAGS,
} from '../domain/plugin-permissions';

@Injectable()
export class PluginSandboxService {
  private readonly KNOWN_PERMISSIONS = new Set<string>(Object.keys(PLUGIN_PERMISSION_META));
  private readonly DISALLOWED_FLAGS = new Set(['allow-same-origin', 'allow-top-navigation', 'allow-top-navigation-by-user-activation']);

  validateManifest(raw: unknown): PluginManifest {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Plugin manifest must be a JSON object');
    }

    const manifest = raw as Record<string, unknown>;

    if (typeof manifest['version'] !== 'string' || !manifest['version'].trim()) {
      throw new BadRequestException('Manifest must declare a version string');
    }

    if (typeof manifest['entrypoint'] !== 'string' || !manifest['entrypoint'].trim()) {
      throw new BadRequestException('Manifest must declare an entrypoint');
    }

    this.assertSafeEntrypoint(manifest['entrypoint'] as string);

    if (!Array.isArray(manifest['permissions'])) {
      throw new BadRequestException('Manifest must declare a permissions array');
    }

    const unknownPerms = (manifest['permissions'] as string[]).filter(
      p => !this.KNOWN_PERMISSIONS.has(p),
    );
    if (unknownPerms.length) {
      throw new BadRequestException(`Unknown permissions: ${unknownPerms.join(', ')}`);
    }

    if (manifest['sandboxFlags'] !== undefined) {
      if (!Array.isArray(manifest['sandboxFlags'])) {
        throw new BadRequestException('sandboxFlags must be an array');
      }
      this.assertSafeSandboxFlags(manifest['sandboxFlags'] as string[]);
    }

    return manifest as unknown as PluginManifest;
  }

  checkRequiredPermissions(manifest: PluginManifest, required: PluginPermission[]): void {
    const granted = new Set(manifest.permissions);
    const missing = required.filter(p => !granted.has(p));
    if (missing.length) {
      throw new BadRequestException(
        `Plugin is missing required permissions: ${missing.join(', ')}`,
      );
    }
  }

  buildSandboxAttribute(manifest: PluginManifest): string {
    const base: string[] = ['allow-scripts'];
    const extras = (manifest.sandboxFlags ?? []).filter(
      f => ALLOWED_SANDBOX_FLAGS.includes(f as any),
    );
    return [...new Set([...base, ...extras])].join(' ');
  }

  buildCsp(manifest: PluginManifest): string {
    const hasStorage = manifest.permissions.includes('access:storage');
    const connectSrc = hasStorage ? "'self' blob:" : "'self'";
    return [
      "default-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "frame-ancestors 'self'",
    ].join('; ');
  }

  private assertSafeEntrypoint(entrypoint: string): void {
    if (/^https?:\/\//i.test(entrypoint)) {
      // External URLs must be from known CDN allowlist — block by default
      throw new BadRequestException(
        'External entrypoint URLs are not allowed. Use a relative path.',
      );
    }
    // Prevent path traversal
    if (entrypoint.includes('..')) {
      throw new BadRequestException('Entrypoint path must not contain ".."');
    }
  }

  private assertSafeSandboxFlags(flags: string[]): void {
    const dangerous = flags.filter(f => this.DISALLOWED_FLAGS.has(f));
    if (dangerous.length) {
      throw new BadRequestException(
        `Dangerous sandbox flags are not allowed: ${dangerous.join(', ')}. ` +
          'In particular "allow-same-origin" would bypass the sandbox entirely.',
      );
    }

    const unknown = flags.filter(
      f => !ALLOWED_SANDBOX_FLAGS.includes(f as any),
    );
    if (unknown.length) {
      throw new BadRequestException(`Unrecognised sandbox flags: ${unknown.join(', ')}`);
    }
  }
}
