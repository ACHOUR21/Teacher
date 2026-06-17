'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Key, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { toast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ApiKeyCreated extends ApiKeyItem {
  key: string;
}

interface UsageStat {
  keyId: string;
  name: string;
  requestsToday: number;
  requestsThisMonth: number;
}

interface CreateKeyForm {
  name: string;
  scopes: string[];
  rateLimit: number;
  expiresInDays: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_SCOPES = [
  { value: 'read:courses',         label: 'Read Courses' },
  { value: 'write:courses',        label: 'Write Courses' },
  { value: 'read:users',           label: 'Read Users' },
  { value: 'write:enrollments',    label: 'Write Enrollments' },
  { value: 'read:analytics',       label: 'Read Analytics' },
  { value: 'admin:all',            label: 'Admin (All Access)' },
];

const DEFAULT_FORM: CreateKeyForm = {
  name: '',
  scopes: ['read:courses'],
  rateLimit: 1000,
  expiresInDays: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(val: string | null): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString();
}

function toggleScope(scopes: string[], scope: string): string[] {
  return scopes.includes(scope) ? scopes.filter(s => s !== scope) : [...scopes, scope];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiKeysSettingsPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen]     = useState(false);
  const [revealOpen, setRevealOpen]     = useState(false);
  const [revealedKey, setRevealedKey]   = useState('');
  const [copied, setCopied]             = useState(false);
  const [form, setForm]                 = useState<CreateKeyForm>(DEFAULT_FORM);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: keys = [], isLoading: keysLoading } = useQuery<ApiKeyItem[]>({
    queryKey: ['user-api-keys'],
    queryFn: () => api.get('/api-ecosystem/api-keys').then(r => r.data?.data ?? r.data),
  });

  const { data: usage = [] } = useQuery<UsageStat[]>({
    queryKey: ['user-api-keys-usage'],
    queryFn: () => api.get('/api-ecosystem/api-keys/usage').then(r => r.data?.data ?? r.data),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; scopes: string[]; rateLimit: number; expiresInDays?: number }) =>
      api.post('/api-ecosystem/api-keys', dto).then(r => r.data?.data ?? r.data as ApiKeyCreated),
    onSuccess: (result: ApiKeyCreated) => {
      queryClient.invalidateQueries({ queryKey: ['user-api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['user-api-keys-usage'] });
      setCreateOpen(false);
      setForm(DEFAULT_FORM);
      if (result?.key) {
        setRevealedKey(result.key);
        setRevealOpen(true);
      } else {
        toast.success('API key created');
      }
    },
    onError: () => toast.error('Failed to create API key'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-ecosystem/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['user-api-keys-usage'] });
      toast.success('API key revoked');
    },
    onError: () => toast.error('Failed to revoke key'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleCreate() {
    const dto: { name: string; scopes: string[]; rateLimit: number; expiresInDays?: number } = {
      name: form.name.trim(),
      scopes: form.scopes,
      rateLimit: form.rateLimit,
    };
    if (form.expiresInDays) {
      const days = parseInt(form.expiresInDays, 10);
      if (!isNaN(days) && days > 0) dto.expiresInDays = days;
    }
    createMutation.mutate(dto);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed — please select the key manually');
    }
  }

  // ── Usage map ─────────────────────────────────────────────────────────────────
  const usageMap = Object.fromEntries(usage.map(u => [u.keyId, u]));

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider';
  const tdClass = 'px-4 py-3 text-sm';

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-600" />
            API Keys
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate personal API keys to access the EduAI API programmatically.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { setForm(DEFAULT_FORM); setCreateOpen(true); }}
        >
          Create New Key
        </Button>
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Prefix</th>
                  <th className={thClass}>Scopes</th>
                  <th className={thClass}>Rate Limit</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Last Used</th>
                  <th className={thClass}>Created</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {keysLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className={tdClass}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: j === 0 ? '120px' : '70px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      No API keys yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  keys.map(key => (
                    <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                      <td className={cn(tdClass, 'font-medium text-gray-900')}>{key.name}</td>
                      <td className={tdClass}>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {key.keyPrefix}••••
                        </span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map(s => (
                            <span
                              key={s}
                              className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={cn(tdClass, 'text-gray-600')}>{key.rateLimit.toLocaleString()}/hr</td>
                      <td className={tdClass}>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                          key.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500',
                        )}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className={cn(tdClass, 'text-gray-500 whitespace-nowrap')}>
                        {formatDate(key.lastUsedAt)}
                      </td>
                      <td className={cn(tdClass, 'text-gray-500 whitespace-nowrap')}>
                        {formatDate(key.createdAt)}
                      </td>
                      <td className={tdClass}>
                        {key.isActive && (
                          <button
                            title="Revoke key"
                            onClick={() => revokeMutation.mutate(key.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className={thClass}>Key Name</th>
                    <th className={thClass}>Requests Today</th>
                    <th className={thClass}>Requests This Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usage.map(stat => (
                    <tr key={stat.keyId} className="hover:bg-gray-50">
                      <td className={cn(tdClass, 'font-medium text-gray-900')}>{stat.name}</td>
                      <td className={tdClass}>{stat.requestsToday.toLocaleString()}</td>
                      <td className={tdClass}>{stat.requestsThisMonth.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Create Key Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Production Integration"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Scopes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scopes <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {AVAILABLE_SCOPES.map(scope => (
                  <label key={scope.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.scopes.includes(scope.value)}
                      onChange={() => setForm(f => ({ ...f, scopes: toggleScope(f.scopes, scope.value) }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">{scope.label}</span>
                      <span className="ml-2 font-mono text-xs text-gray-400">{scope.value}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rate Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Limit (requests / hour)
              </label>
              <input
                type="number"
                value={form.rateLimit}
                min={1}
                onChange={e => setForm(f => ({ ...f, rateLimit: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires in (days) — optional
              </label>
              <input
                type="number"
                value={form.expiresInDays}
                min={1}
                placeholder="e.g. 90"
                onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              loading={createMutation.isPending}
              disabled={!form.name.trim() || form.scopes.length === 0}
              onClick={handleCreate}
            >
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reveal Key Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={revealOpen}
        onOpenChange={open => { if (!open) { setRevealOpen(false); setRevealedKey(''); } }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 font-medium">
              This key will not be shown again. Copy it now and store it somewhere safe.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your API Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={revealedKey}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-50 select-all focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  leftIcon={copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => { setRevealOpen(false); setRevealedKey(''); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
