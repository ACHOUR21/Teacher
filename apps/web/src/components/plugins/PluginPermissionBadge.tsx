'use client';

import { Shield, ShieldAlert, ShieldCheck, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

export type PluginPermission =
  | 'read:courses' | 'read:users' | 'read:grades' | 'read:assignments'
  | 'read:calendar' | 'read:analytics'
  | 'write:courses' | 'write:grades' | 'write:assignments' | 'write:calendar'
  | 'send:notifications' | 'access:storage' | 'manage:users' | 'access:billing';

const PERMISSION_META: Record<PluginPermission, { label: string; risk: 'low' | 'medium' | 'high' }> = {
  'read:courses':       { label: 'Read courses',               risk: 'low'    },
  'read:users':         { label: 'Read user profiles',         risk: 'low'    },
  'read:grades':        { label: 'Read grades',                risk: 'medium' },
  'read:assignments':   { label: 'Read assignments',           risk: 'low'    },
  'read:calendar':      { label: 'Read calendar events',       risk: 'low'    },
  'read:analytics':     { label: 'Read analytics data',        risk: 'low'    },
  'write:courses':      { label: 'Create / modify courses',    risk: 'medium' },
  'write:grades':       { label: 'Submit grades',              risk: 'high'   },
  'write:assignments':  { label: 'Create / modify assignments', risk: 'medium' },
  'write:calendar':     { label: 'Modify calendar events',     risk: 'medium' },
  'send:notifications': { label: 'Send notifications',         risk: 'medium' },
  'access:storage':     { label: 'Access file storage',        risk: 'high'   },
  'manage:users':       { label: 'Manage users',               risk: 'high'   },
  'access:billing':     { label: 'Access billing data',        risk: 'high'   },
};

const RISK_CONFIG = {
  low:    { icon: ShieldCheck, bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  medium: { icon: Shield,      bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  high:   { icon: ShieldAlert, bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
};

interface Props {
  permission: PluginPermission;
  className?: string;
}

export function PluginPermissionBadge({ permission, className }: Props) {
  const meta = PERMISSION_META[permission];
  if (!meta) {return null;}

  const { icon: Icon, bg, text, border } = RISK_CONFIG[meta.risk];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        bg, text, border, className,
      )}
      title={permission}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      {meta.label}
    </span>
  );
}

interface ListProps {
  permissions: PluginPermission[];
  maxVisible?: number;
}

export function PluginPermissionList({ permissions, maxVisible = 4 }: ListProps) {
  const visible = permissions.slice(0, maxVisible);
  const overflow = permissions.length - maxVisible;
  const hasHigh = permissions.some(p => PERMISSION_META[p]?.risk === 'high');

  return (
    <div className="space-y-1.5">
      {hasHigh && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
          <ShieldAlert className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>This plugin requests elevated permissions. Review carefully before installing.</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {visible.map(p => <PluginPermissionBadge key={p} permission={p} />)}
        {overflow > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <Info className="h-3 w-3" />+{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}
