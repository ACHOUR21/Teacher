export const PLUGIN_PERMISSION_META = {
  'read:courses':       { label: 'Read courses',              risk: 'low'    },
  'read:users':         { label: 'Read user profiles',        risk: 'low'    },
  'read:grades':        { label: 'Read grades',               risk: 'medium' },
  'read:assignments':   { label: 'Read assignments',          risk: 'low'    },
  'read:calendar':      { label: 'Read calendar events',      risk: 'low'    },
  'read:analytics':     { label: 'Read analytics data',       risk: 'low'    },
  'write:courses':      { label: 'Create / modify courses',   risk: 'medium' },
  'write:grades':       { label: 'Submit grades',             risk: 'high'   },
  'write:assignments':  { label: 'Create / modify assignments', risk: 'medium' },
  'write:calendar':     { label: 'Modify calendar events',    risk: 'medium' },
  'send:notifications': { label: 'Send notifications',        risk: 'medium' },
  'access:storage':     { label: 'Access file storage',       risk: 'high'   },
  'manage:users':       { label: 'Manage users',              risk: 'high'   },
  'access:billing':     { label: 'Access billing data',       risk: 'high'   },
} as const;

export type PluginPermission = keyof typeof PLUGIN_PERMISSION_META;

export const ALLOWED_SANDBOX_FLAGS = [
  'allow-scripts',
  'allow-forms',
  'allow-popups',
  'allow-modals',
] as const;

export type SandboxFlag = (typeof ALLOWED_SANDBOX_FLAGS)[number];

export interface PluginManifest {
  version: string;
  entrypoint: string;
  permissions: PluginPermission[];
  sandboxFlags?: SandboxFlag[];
  hooks?: Array<{ event: string; handler: string }>;
}
