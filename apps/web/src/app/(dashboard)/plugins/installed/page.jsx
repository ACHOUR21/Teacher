'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Puzzle, ToggleLeft, ToggleRight, Trash2, Settings, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}
function formatPrice(cents) {
    if (cents === 0)
        {return 'Free';}
    return `$${(cents / 100).toFixed(0)}/mo`;
}
function ConfigModal({ plugin, onClose, onSave, isSaving }) {
    const [raw, setRaw] = useState(JSON.stringify(plugin.config, null, 2));
    const [error, setError] = useState(null);
    function handleSave() {
        try {
            const parsed = JSON.parse(raw);
            setError(null);
            onSave(parsed);
        }
        catch {
            setError('Invalid JSON — please check your syntax');
        }
    }
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Configure {plugin.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Edit JSON configuration for this plugin</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light leading-none">
            ×
          </button>
        </div>
        <div className="p-5 space-y-3">
          <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={10} spellCheck={false} className="w-full font-mono text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"/>
          {error && (<p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5"/> {error}
            </p>)}
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60">
            {isSaving ? 'Saving…' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>);
}
export default function InstalledPluginsPage() {
    const qc = useQueryClient();
    const [configTarget, setConfigTarget] = useState(null);
    const [toast, setToast] = useState(null);
    function showToast(type, message) {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }
    const { data: installed, isLoading } = useQuery({
        queryKey: ['installed-plugins'],
        queryFn: () => api.get('/plugins/installed').then(r => r.data),
    });
    const toggleMutation = useMutation({
        mutationFn: ({ pluginId, enabled }) => api.patch(`/plugins/installed/${pluginId}/toggle`, { enabled }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['installed-plugins'] });
            showToast('success', 'Plugin updated');
        },
        onError: () => showToast('error', 'Failed to update plugin'),
    });
    const uninstallMutation = useMutation({
        mutationFn: (pluginId) => api.delete(`/plugins/installed/${pluginId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['installed-plugins'] });
            showToast('success', 'Plugin uninstalled');
        },
        onError: () => showToast('error', 'Failed to uninstall plugin'),
    });
    const configMutation = useMutation({
        mutationFn: ({ pluginId, config }) => api.patch(`/plugins/installed/${pluginId}/config`, { config }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['installed-plugins'] });
            setConfigTarget(null);
            showToast('success', 'Configuration saved');
        },
        onError: () => showToast('error', 'Failed to save configuration'),
    });
    return (<div className="space-y-6">
      {/* Toast */}
      {toast && (<div className={cn('fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium', toast.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200')}>
          {toast.type === 'success' ? (<CheckCircle className="h-4 w-4 flex-shrink-0"/>) : (<AlertTriangle className="h-4 w-4 flex-shrink-0"/>)}
          {toast.message}
        </div>)}

      {configTarget && (<ConfigModal plugin={configTarget} onClose={() => setConfigTarget(null)} onSave={config => configMutation.mutate({ pluginId: configTarget.pluginId, config })} isSaving={configMutation.isPending}/>)}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-purple-500"/> Installed Plugins
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage plugins installed for your tenant</p>
        </div>
        <Link href="/plugins" className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
          <ArrowLeft className="h-4 w-4"/> Browse Marketplace
        </Link>
      </div>

      {isLoading ? (<div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"/>))}
        </div>) : !installed || installed.length === 0 ? (<div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Puzzle className="h-12 w-12 text-gray-300 mx-auto mb-3"/>
          <p className="text-gray-500 font-medium">No plugins installed yet</p>
          <Link href="/plugins" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Browse marketplace
          </Link>
        </div>) : (<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plugin</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Installed</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {installed.map(inst => (<tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg flex-shrink-0">
                        🔌
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{inst.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{inst.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 font-mono text-xs">v{inst.version}</td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', inst.price === 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-700')}>
                      {formatPrice(inst.price)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', inst.enabled
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', inst.enabled ? 'bg-green-500' : 'bg-gray-400')}/>
                      {inst.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {formatDate(inst.installedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setConfigTarget(inst)} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Configure">
                        <Settings className="h-4 w-4"/>
                      </button>
                      <button onClick={() => toggleMutation.mutate({ pluginId: inst.pluginId, enabled: !inst.enabled })} disabled={toggleMutation.isPending} className={cn('transition-colors', inst.enabled ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-gray-500')} title={inst.enabled ? 'Disable' : 'Enable'}>
                        {inst.enabled
                    ? <ToggleRight className="h-6 w-6"/>
                    : <ToggleLeft className="h-6 w-6"/>}
                      </button>
                      <button onClick={() => {
                    if (confirm(`Uninstall ${inst.name}? This cannot be undone.`)) {
                        uninstallMutation.mutate(inst.pluginId);
                    }
                }} disabled={uninstallMutation.isPending} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Uninstall">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
