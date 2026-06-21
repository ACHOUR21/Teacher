'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Webhook, Plus, Copy, Check, Trash2, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, } from '@/components/ui/Dialog';
import { toast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_SCOPES = ['read', 'write', 'admin', 'courses', 'ai', 'billing'];
const ALL_EVENTS = [
    'course.enrolled',
    'assignment.submitted',
    'payment.completed',
    'user.registered',
    'live.started',
];
const DEFAULT_KEY_FORM = {
    name: '',
    scopes: ['read'],
    rateLimit: 1000,
    expiresAt: '',
};
const DEFAULT_WEBHOOK_FORM = {
    url: '',
    events: [],
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
function toggleArrayItem(arr, item) {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}
function formatDate(str) {
    if (!str) {
        return '—';
    }
    return new Date(str).toLocaleDateString();
}
// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }) {
    return (<Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5"/>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>);
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApiKeysPage() {
    const queryClient = useQueryClient();
    // Modal state
    const [createKeyOpen, setCreateKeyOpen] = useState(false);
    const [revealKeyOpen, setRevealKeyOpen] = useState(false);
    const [revealedKey, setRevealedKey] = useState('');
    const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    // Form state
    const [keyForm, setKeyForm] = useState(DEFAULT_KEY_FORM);
    const [webhookForm, setWebhookForm] = useState(DEFAULT_WEBHOOK_FORM);
    // ── Queries ──────────────────────────────────────────────────────────────────
    const { data: stats } = useQuery({
        queryKey: ['api-ecosystem-stats'],
        queryFn: () => api.get('/api-ecosystem/stats').then(r => r.data.data),
    });
    const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
        queryKey: ['api-keys-list'],
        queryFn: () => api.get('/api-ecosystem/keys').then(r => r.data.data),
    });
    const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
        queryKey: ['webhooks-list'],
        queryFn: () => api.get('/api-ecosystem/webhooks').then(r => r.data.data),
    });
    // ── Mutations ─────────────────────────────────────────────────────────────────
    const createKeyMutation = useMutation({
        mutationFn: (dto) => api.post('/api-ecosystem/keys', dto).then(r => r.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys-list'] });
            queryClient.invalidateQueries({ queryKey: ['api-ecosystem-stats'] });
            const raw = res?.data?.rawKey ?? res?.rawKey ?? '';
            setCreateKeyOpen(false);
            setKeyForm(DEFAULT_KEY_FORM);
            if (raw) {
                setRevealedKey(raw);
                setRevealKeyOpen(true);
            }
            else {
                toast.success('API key created');
            }
        },
        onError: () => toast.error('Failed to create key'),
    });
    const revokeKeyMutation = useMutation({
        mutationFn: (id) => api.delete(`/api-ecosystem/keys/${id}`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys-list'] });
            queryClient.invalidateQueries({ queryKey: ['api-ecosystem-stats'] });
            toast.success('Key revoked');
        },
        onError: () => toast.error('Failed to revoke key'),
    });
    const toggleKeyMutation = useMutation({
        mutationFn: (id) => api.patch(`/api-ecosystem/keys/${id}/toggle`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys-list'] });
            queryClient.invalidateQueries({ queryKey: ['api-ecosystem-stats'] });
        },
        onError: () => toast.error('Failed to toggle key'),
    });
    const createWebhookMutation = useMutation({
        mutationFn: (dto) => api.post('/api-ecosystem/webhooks', dto).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks-list'] });
            queryClient.invalidateQueries({ queryKey: ['api-ecosystem-stats'] });
            setCreateWebhookOpen(false);
            setWebhookForm(DEFAULT_WEBHOOK_FORM);
            toast.success('Webhook added');
        },
        onError: () => toast.error('Failed to add webhook'),
    });
    const deleteWebhookMutation = useMutation({
        mutationFn: (id) => api.delete(`/api-ecosystem/webhooks/${id}`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks-list'] });
            queryClient.invalidateQueries({ queryKey: ['api-ecosystem-stats'] });
            toast.success('Webhook deleted');
        },
        onError: () => toast.error('Failed to delete webhook'),
    });
    // ── Handlers ──────────────────────────────────────────────────────────────────
    async function handleCopyKey() {
        try {
            await navigator.clipboard.writeText(revealedKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch {
            toast.error('Copy failed', 'Please copy the key manually.');
        }
    }
    const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider';
    const tdClass = 'px-4 py-3 text-sm';
    return (<div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="h-6 w-6 text-blue-600"/>
          API Keys &amp; Webhooks
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage API keys and webhook endpoints for third-party integrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Keys" value={stats?.totalKeys ?? 0} icon={Key}/>
        <StatCard label="Active Keys" value={stats?.activeKeys ?? 0} icon={ShieldCheck}/>
        <StatCard label="Webhooks" value={stats?.webhooks ?? 0} icon={Webhook}/>
      </div>

      {/* ── API Keys Section ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API Keys</CardTitle>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4"/>} onClick={() => { setKeyForm(DEFAULT_KEY_FORM); setCreateKeyOpen(true); }}>
              Create New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Key Prefix</th>
                  <th className={thClass}>Scopes</th>
                  <th className={thClass}>Rate Limit</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Last Used</th>
                  <th className={thClass}>Created</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {keysLoading ? (Array.from({ length: 4 }).map((_, i) => (<tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (<td key={j} className={tdClass}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: j === 0 ? '100px' : '70px' }}/>
                        </td>))}
                    </tr>))) : apiKeys.length === 0 ? (<tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      No API keys yet. Create one to get started.
                    </td>
                  </tr>) : (apiKeys.map(key => (<tr key={key.id} className="hover:bg-gray-50 transition-colors">
                      <td className={cn(tdClass, 'font-medium text-gray-900')}>{key.name}</td>
                      <td className={tdClass}>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {key.keyPrefix}••••
                        </span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map(s => (<span key={s} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              {s}
                            </span>))}
                        </div>
                      </td>
                      <td className={cn(tdClass, 'text-gray-600')}>{key.rateLimit}/hr</td>
                      <td className={tdClass}>
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', key.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500')}>
                          {key.status}
                        </span>
                      </td>
                      <td className={cn(tdClass, 'text-gray-500 whitespace-nowrap')}>
                        {formatDate(key.lastUsedAt)}
                      </td>
                      <td className={cn(tdClass, 'text-gray-500 whitespace-nowrap')}>
                        {formatDate(key.createdAt)}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleKeyMutation.mutate(key.id)} title={key.status === 'active' ? 'Disable key' : 'Enable key'} className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded">
                            {key.status === 'active'
                ? <ToggleRight className="h-4 w-4 text-green-500"/>
                : <ToggleLeft className="h-4 w-4"/>}
                          </button>
                          <button onClick={() => revokeKeyMutation.mutate(key.id)} title="Revoke key" className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Webhooks Section ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Webhook Endpoints</CardTitle>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4"/>} onClick={() => { setWebhookForm(DEFAULT_WEBHOOK_FORM); setCreateWebhookOpen(true); }}>
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className={thClass}>URL</th>
                  <th className={thClass}>Events</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Created</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {webhooksLoading ? (Array.from({ length: 3 }).map((_, i) => (<tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (<td key={j} className={tdClass}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: j === 0 ? '200px' : '80px' }}/>
                        </td>))}
                    </tr>))) : webhooks.length === 0 ? (<tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                      No webhook endpoints yet. Add one to receive event notifications.
                    </td>
                  </tr>) : (webhooks.map(wh => (<tr key={wh.id} className="hover:bg-gray-50 transition-colors">
                      <td className={cn(tdClass, 'font-mono text-xs text-gray-700 max-w-xs truncate')}>
                        <span title={wh.url}>{wh.url}</span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map(ev => (<span key={ev} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                              {ev}
                            </span>))}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', wh.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500')}>
                          {wh.status}
                        </span>
                      </td>
                      <td className={cn(tdClass, 'text-gray-500 whitespace-nowrap')}>
                        {formatDate(wh.createdAt)}
                      </td>
                      <td className={tdClass}>
                        <button onClick={() => deleteWebhookMutation.mutate(wh.id)} title="Delete webhook" className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create API Key Modal ──────────────────────────────────────────────── */}
      <Dialog open={createKeyOpen} onOpenChange={setCreateKeyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input type="text" value={keyForm.name} onChange={e => setKeyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Production Integration" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scopes</label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_SCOPES.map(scope => (<label key={scope} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={keyForm.scopes.includes(scope)} onChange={() => setKeyForm(f => ({ ...f, scopes: toggleArrayItem(f.scopes, scope) }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <span className="text-sm text-gray-700">{scope}</span>
                  </label>))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (requests/hour)</label>
              <input type="number" value={keyForm.rateLimit} min={1} onChange={e => setKeyForm(f => ({ ...f, rateLimit: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
              <input type="date" value={keyForm.expiresAt} onChange={e => setKeyForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" loading={createKeyMutation.isPending} disabled={!keyForm.name.trim() || keyForm.scopes.length === 0} onClick={() => createKeyMutation.mutate(keyForm)}>
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reveal Key Modal ─────────────────────────────────────────────────── */}
      <Dialog open={revealKeyOpen} onOpenChange={(open) => { if (!open) {
        setRevealKeyOpen(false);
        setRevealedKey('');
    } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              This key will only be shown once. Copy and store it securely before closing this dialog.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your API Key</label>
              <div className="flex gap-2">
                <input type="text" readOnly value={revealedKey} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-50 focus:outline-none"/>
                <Button variant="outline" size="sm" onClick={handleCopyKey} leftIcon={copied ? <Check className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4"/>}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => { setRevealKeyOpen(false); setRevealedKey(''); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Webhook Modal ──────────────────────────────────────────────── */}
      <Dialog open={createWebhookOpen} onOpenChange={setCreateWebhookOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
              <input type="url" value={webhookForm.url} onChange={e => setWebhookForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-server.com/webhook" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Events to subscribe</label>
              <div className="space-y-2">
                {ALL_EVENTS.map(event => (<label key={event} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={webhookForm.events.includes(event)} onChange={() => setWebhookForm(f => ({ ...f, events: toggleArrayItem(f.events, event) }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <span className="text-sm text-gray-700 font-mono">{event}</span>
                  </label>))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" loading={createWebhookMutation.isPending} disabled={!webhookForm.url.trim() || webhookForm.events.length === 0} onClick={() => createWebhookMutation.mutate(webhookForm)}>
              Add Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
