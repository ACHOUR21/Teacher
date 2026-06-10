'use client';

import { ShieldCheck, AlertTriangle, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

import { cn } from '@/lib/utils';

import { PluginPermissionList, type PluginPermission } from './PluginPermissionBadge';


export interface PluginSandboxProps {
  pluginId: string;
  pluginName: string;
  entrypoint: string;
  permissions: PluginPermission[];
  sandboxAttr?: string;
  className?: string;
  onMessage?: (type: string, payload: unknown) => void;
  onError?: (message: string) => void;
}

type SandboxPhase = 'consent' | 'loading' | 'running' | 'error';

// Messages the plugin iframe is allowed to send out
const ALLOWED_OUTBOUND_TYPES = new Set([
  'plugin:ready',
  'plugin:navigate',
  'plugin:toast',
  'plugin:request',
  'plugin:resize',
]);

export function PluginSandbox({
  pluginId,
  pluginName,
  entrypoint,
  permissions,
  sandboxAttr = 'allow-scripts',
  className,
  onMessage,
  onError,
}: PluginSandboxProps) {
  const [phase, setPhase] = useState<SandboxPhase>('consent');
  const [errorMsg, setErrorMsg] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => setPhase('running'), []);

  const handleError = useCallback(() => {
    const msg = 'Plugin failed to load';
    setErrorMsg(msg);
    setPhase('error');
    onError?.(msg);
  }, [onError]);

  // postMessage bridge — only forward allowlisted message types
  useEffect(() => {
    if (phase !== 'running') {return;}

    function listener(event: MessageEvent) {
      // Ignore messages not from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {return;}

      const { type, payload } = (event.data ?? {}) as { type?: string; payload?: unknown };
      if (!type || !ALLOWED_OUTBOUND_TYPES.has(type)) {return;}

      onMessage?.(type, payload);
    }

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [phase, onMessage]);

  if (phase === 'consent') {
    return (
      <div className={cn('rounded-2xl border border-gray-200 bg-white p-6 space-y-4', className)}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{pluginName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              This plugin will run in an isolated sandbox. It cannot access your cookies,
              localStorage, or other page content.
            </p>
          </div>
        </div>

        {permissions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Requested permissions:</p>
            <PluginPermissionList permissions={permissions} />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setPhase('loading')}
            className="flex-1 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Run plugin
          </button>
          <button
            onClick={() => onError?.('User declined plugin')}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className={cn('rounded-2xl border border-red-200 bg-red-50 p-6 flex items-center gap-3', className)}>
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-700">Plugin error</p>
          <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-2xl border border-gray-200 overflow-hidden', className)}>
      {phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        // entrypoint must be a relative path validated server-side
        src={entrypoint}
        // No allow-same-origin: prevents the plugin from accessing parent context
        sandbox={sandboxAttr}
        title={pluginName}
        onLoad={handleLoad}
        onError={handleError}
        data-plugin-id={pluginId}
        className="w-full min-h-[400px] border-0"
        // Referrer policy: don't leak URL to plugin
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
