'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, Download, Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PluginListing {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  author: string;
  price: number;
  rating: number;
  installs: number;
  iconUrl: string;
  tags: string[];
  permissions: string[];
  screenshots: string[];
}

interface InstalledPlugin {
  pluginId: string;
}

const PERMISSION_RISK: Record<string, 'low' | 'medium' | 'high'> = {
  'read:courses': 'low', 'read:users': 'low', 'read:grades': 'medium',
  'read:assignments': 'low', 'read:calendar': 'low', 'read:analytics': 'low',
  'write:courses': 'medium', 'write:grades': 'high', 'write:assignments': 'medium',
  'write:calendar': 'medium', 'send:notifications': 'medium',
  'access:storage': 'high', 'manage:users': 'high', 'access:billing': 'high',
};

const RISK_COLORS = {
  low:    'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high:   'bg-red-50 text-red-700 border-red-200',
};

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}/mo`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300',
          )}
        />
      ))}
      <span className="text-sm font-medium text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function PluginDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const pluginId = params.id as string;
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: plugin, isLoading } = useQuery<PluginListing>({
    queryKey: ['plugin-catalog', pluginId],
    queryFn: () => api.get(`/plugins/catalog/${pluginId}`).then(r => r.data),
  });

  const { data: installed } = useQuery<InstalledPlugin[]>({
    queryKey: ['installed-plugins'],
    queryFn: () => api.get('/plugins/installed').then(r => r.data),
  });

  const isInstalled = installed?.some(p => p.pluginId === pluginId) ?? false;

  const installMutation = useMutation({
    mutationFn: () => api.post('/plugins/installed', { pluginId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installed-plugins'] });
      qc.invalidateQueries({ queryKey: ['plugin-catalog'] });
      setToast({ type: 'success', message: `${plugin?.name ?? 'Plugin'} installed successfully!` });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to install plugin';
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Plugin not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const hasHighRisk = plugin.permissions.some(p => PERMISSION_RISK[p] === 'high');

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all',
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200',
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl flex-shrink-0">
            🔌
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{plugin.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  by {plugin.author} · v{plugin.version}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-semibold',
                    plugin.price === 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700',
                  )}
                >
                  {formatPrice(plugin.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <StarRating rating={plugin.rating} />
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Download className="h-4 w-4" />
                {plugin.installs.toLocaleString()} installs
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {plugin.category}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-gray-600 leading-relaxed">{plugin.description}</p>

        {/* Tags */}
        {plugin.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {plugin.tags.map(tag => (
              <span key={tag} className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex gap-3">
          {isInstalled ? (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
              <CheckCircle className="h-4 w-4" /> Installed
            </div>
          ) : plugin.price > 0 ? (
            <>
              <button
                onClick={() => installMutation.mutate()}
                disabled={installMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {installMutation.isPending ? 'Installing…' : 'Start Free Trial'}
              </button>
              <button
                onClick={() => installMutation.mutate()}
                disabled={installMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <ExternalLink className="h-4 w-4" /> Learn More
              </button>
            </>
          ) : (
            <button
              onClick={() => installMutation.mutate()}
              disabled={installMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {installMutation.isPending ? 'Installing…' : 'Install Plugin'}
            </button>
          )}
        </div>
      </div>

      {/* Permissions */}
      {plugin.permissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-gray-500" /> Required Permissions
          </h2>

          {hasHighRisk && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                This plugin requests elevated permissions. Review carefully before installing.
              </span>
            </div>
          )}

          <div className="space-y-2">
            {plugin.permissions.map(perm => {
              const risk = PERMISSION_RISK[perm] ?? 'low';
              return (
                <div
                  key={perm}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
                    RISK_COLORS[risk],
                  )}
                >
                  <span>{perm}</span>
                  <span className="text-xs font-medium capitalize">{risk} risk</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screenshots placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Screenshots</h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map(i => (
            <div
              key={i}
              className="aspect-video bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-sm"
            >
              Screenshot {i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
