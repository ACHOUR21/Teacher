'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Puzzle, Download, Trash2, ToggleLeft, ToggleRight, Search, Star, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function PluginsPage() {
  const [tab, setTab] = useState<'marketplace' | 'installed'>('marketplace');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const qc = useQueryClient();

  const { data: marketplace, isLoading: marketplaceLoading } = useQuery({
    queryKey: ['plugin-marketplace', search, category],
    queryFn: () => api.get('/plugins/marketplace', {
      params: { search: search || undefined, category: category || undefined, limit: 24 },
    }).then(r => r.data.data),
    enabled: tab === 'marketplace',
  });

  const { data: categories } = useQuery({
    queryKey: ['plugin-categories'],
    queryFn: () => api.get('/plugins/marketplace/categories').then(r => r.data),
  });

  const { data: installed, isLoading: installedLoading } = useQuery({
    queryKey: ['installed-plugins'],
    queryFn: () => api.get('/plugins/installed').then(r => r.data.data),
    enabled: tab === 'installed',
  });

  const installMutation = useMutation({
    mutationFn: (pluginId: string) => api.post(`/plugins/install/${pluginId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plugin-marketplace'] }); qc.invalidateQueries({ queryKey: ['installed-plugins'] }); },
  });

  const uninstallMutation = useMutation({
    mutationFn: (pluginId: string) => api.delete(`/plugins/uninstall/${pluginId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installed-plugins'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ pluginId, isEnabled }: { pluginId: string; isEnabled: boolean }) =>
      api.patch(`/plugins/${pluginId}/toggle`, { isEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installed-plugins'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-purple-500" /> Plugin Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1">Extend your platform with powerful plugins</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['marketplace', 'installed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t}
              {t === 'installed' && (installed as any[])?.length > 0 && (
                <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">
                  {(installed as any[]).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'marketplace' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              {(categories as string[] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {marketplaceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : (marketplace as any[])?.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No plugins found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(marketplace as any[])?.map((plugin: any) => (
                <div key={plugin.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">
                      {plugin.icon ?? '🔌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{plugin.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{plugin.category}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {plugin.rating?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{plugin.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Download className="h-3.5 w-3.5" />
                      {plugin.installCount?.toLocaleString() ?? 0}
                    </div>
                    <button
                      onClick={() => installMutation.mutate(plugin.id)}
                      disabled={installMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Install
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'installed' && (
        installedLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (installed as any[])?.length === 0 ? (
          <div className="text-center py-20">
            <Puzzle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No plugins installed</p>
            <button onClick={() => setTab('marketplace')} className="mt-3 text-sm text-blue-600 hover:underline">Browse marketplace</button>
          </div>
        ) : (
          <div className="space-y-3">
            {(installed as any[])?.map((inst: any) => (
              <div key={inst.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">
                  {inst.plugin?.icon ?? '🔌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{inst.plugin?.name}</p>
                  <p className="text-xs text-gray-500">{inst.plugin?.description?.slice(0, 60)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ pluginId: inst.pluginId, isEnabled: !inst.isEnabled })}
                    className={cn('transition-colors', inst.isEnabled ? 'text-green-500' : 'text-gray-300')}
                  >
                    {inst.isEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={() => { if (confirm('Uninstall this plugin?')) uninstallMutation.mutate(inst.pluginId); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
