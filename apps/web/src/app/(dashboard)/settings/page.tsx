'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Palette, Bell, Shield, Key, Building, Eye, EyeOff, Check,
  AlertTriangle, BellRing, BellOff, Smartphone, Copy, Download, RefreshCw,
  Trash2, Lock, FileText, AlertOctagon, ChevronRight, Users, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/useToast';
import { setLocale } from '@/i18n/provider';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import type { Locale } from '@/i18n/config';

// ─── Settings Hub Navigation Cards ───────────────────────────────────────────

interface SettingsCard {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const SETTINGS_CARDS: SettingsCard[] = [
  {
    href: '/settings/white-label',
    icon: Palette,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    title: 'White Label / Branding',
    description: 'Customize colors, logo, fonts, and domain for your organization.',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: 'Notifications',
    description: 'Control email, push, and in-app notification preferences.',
  },
  {
    href: '/settings/security',
    icon: Shield,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Security & 2FA',
    description: 'Manage passwords, two-factor authentication, and active sessions.',
  },
  {
    href: '/settings/api-keys',
    icon: Key,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'API Keys',
    description: 'Create and revoke API keys for integrations.',
  },
  {
    href: '/billing',
    icon: CreditCard,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Billing',
    description: 'Manage your subscription, invoices, and payment methods.',
  },
  {
    href: '/settings/team',
    icon: Users,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    title: 'Team Members',
    description: 'Invite collaborators and manage their roles and permissions.',
  },
];

function SettingsNavCard({ card }: { card: SettingsCard }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center', card.iconBg)}>
          <Icon className={cn('h-5 w-5', card.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">
            {card.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{card.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0" />
      </div>
    </Link>
  );
}

// ─── Existing inline tabs (profile, security, notifications, branding, api) ───
// Preserved below for backward compatibility with direct /settings navigation.

type Tab = 'profile' | 'general' | 'security' | 'notifications' | 'branding' | 'api';

const TABS: { id: Tab; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', labelKey: 'profile', icon: User },
  { id: 'general', labelKey: 'general', icon: Building },
  { id: 'security', labelKey: 'security', icon: Shield },
  { id: 'notifications', labelKey: 'notifications', icon: Bell },
  { id: 'branding', labelKey: 'branding', icon: Palette },
  { id: 'api', labelKey: 'api', icon: Key },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white', className)}
      {...props}
    />
  );
}

function PushNotificationToggle() {
  const { status, enable, disable } = usePushNotifications();

  if (status === 'unsupported') {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <BellOff className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-500">Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  if (status === 'granted') {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Push notifications enabled</p>
        </div>
        <Button variant="outline" size="sm" onClick={disable}>Disable</Button>
      </div>
    );
  }

  return (
    <Button onClick={enable} variant="outline" size="sm" className="gap-2">
      <Smartphone className="h-4 w-4" />
      Enable Push Notifications
    </Button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations('settings');
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [notifPrefs, setNotifPrefs] = useState({
    emailCourseUpdates: true,
    emailAssignments: true,
    emailLive: false,
  });
  const [brandForm, setBrandForm] = useState({
    brandName: 'EduAI',
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
  });
  const [newKeyForm, setNewKeyForm] = useState({ name: '', scopes: [] as string[] });
  const [showKey, setShowKey] = useState<string | null>(null);

  const SCOPE_OPTIONS = ['read', 'write', 'admin'];

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data.data ?? r.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/auth/sessions').then(r => r.data.data ?? r.data),
    enabled: activeTab === 'security',
  });

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-ecosystem/keys').then(r => r.data.data ?? r.data),
    enabled: activeTab === 'api',
  });

  const changePwMutation = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => { toast.success('Password changed'); setCurrentPw(''); setNewPw(''); },
    onError: () => toast.error('Failed', 'Could not change password.'),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const brandMutation = useMutation({
    mutationFn: (dto: typeof brandForm) => api.put('/white-label/branding', dto),
    onSuccess: () => toast.success('Branding saved'),
    onError: () => toast.error('Failed', 'Could not save branding.'),
  });

  const createKeyMutation = useMutation({
    mutationFn: (dto: { name: string; scopes: string[] }) =>
      api.post('/api-ecosystem/keys', dto).then(r => r.data.data ?? r.data),
    onSuccess: (data: { key?: string }) => {
      if (data?.key) setShowKey(data.key);
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: () => toast.error('Failed', 'Could not create API key.'),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-ecosystem/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  return (
    <div className="space-y-8">
      {/* ── Settings Hub ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, organization, and platform preferences.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTINGS_CARDS.map((card) => (
          <SettingsNavCard key={card.href} card={card} />
        ))}
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick Settings</p>

        {/* ── Tab nav ────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-full overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.labelKey.charAt(0).toUpperCase() + tab.labelKey.slice(1)}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="First Name">
                  <Input defaultValue={me?.firstName ?? ''} placeholder="First name" />
                </Field>
                <Field label="Last Name">
                  <Input defaultValue={me?.lastName ?? ''} placeholder="Last name" />
                </Field>
                <Field label="Email">
                  <Input defaultValue={me?.email ?? ''} disabled className="bg-gray-50 cursor-not-allowed" />
                </Field>
                <Button onClick={() => toast.info('Saved', 'Profile update coming soon.')}>
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader><CardTitle>General</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Language">
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    defaultValue="en"
                    onChange={(e) => setLocale(e.target.value as Locale)}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                  </select>
                </Field>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Current Password">
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="relative">
                      <Input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder="New password (min 8 chars)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Button onClick={() => changePwMutation.mutate()} disabled={changePwMutation.isPending}>
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(sessions ?? []).map((s: { id: string; device?: string; isCurrent?: boolean; ipAddress?: string; lastActivity?: string; createdAt?: string }) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {s.device ?? 'Unknown device'}
                            {s.isCurrent && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Current</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {s.ipAddress} · Last active {new Date(s.lastActivity ?? s.createdAt ?? Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                        {!s.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeSessionMutation.mutate(s.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                    {!sessions?.length && <p className="text-sm text-gray-400 py-2">No active sessions found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailCourseUpdates', label: 'Course updates', desc: 'New lessons, materials, or announcements' },
                      { key: 'emailAssignments', label: 'Assignment reminders', desc: 'Due dates and grade notifications' },
                      { key: 'emailLive', label: 'Live session reminders', desc: '1 hour before a session starts' },
                    ].map(({ key, label, desc }) => (
                      <label key={key} className="flex items-start justify-between gap-4 cursor-pointer py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                        <div className="relative flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifPrefs[key as keyof typeof notifPrefs]}
                            onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                          />
                          <div className="w-10 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Push Notifications</h3>
                  <p className="text-xs text-gray-500 mb-4">Get instant alerts in your browser.</p>
                  <PushNotificationToggle />
                </div>

                <Button onClick={() => api.patch('/users/me/notifications', notifPrefs).then(() => toast.success('Saved'))}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Branding Tab — quick shortcut, full page at /settings/white-label */}
          {activeTab === 'branding' && (
            <Card>
              <CardHeader><CardTitle>White Label Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700 flex items-start gap-2">
                  <Palette className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    For full branding controls including colors, fonts, border radius, and domain,
                    visit the{' '}
                    <Link href="/settings/white-label" className="font-semibold underline">
                      White Label settings page
                    </Link>.
                  </span>
                </div>
                <Field label="Brand Name">
                  <Input value={brandForm.brandName} onChange={e => setBrandForm(f => ({ ...f, brandName: e.target.value }))} placeholder="Your brand name" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Primary Color">
                    <div className="flex gap-2">
                      <input type="color" value={brandForm.primaryColor} onChange={e => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="h-9 w-12 rounded border border-gray-200 cursor-pointer p-0.5" />
                      <Input value={brandForm.primaryColor} onChange={e => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))} />
                    </div>
                  </Field>
                  <Field label="Secondary Color">
                    <div className="flex gap-2">
                      <input type="color" value={brandForm.secondaryColor} onChange={e => setBrandForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="h-9 w-12 rounded border border-gray-200 cursor-pointer p-0.5" />
                      <Input value={brandForm.secondaryColor} onChange={e => setBrandForm(f => ({ ...f, secondaryColor: e.target.value }))} />
                    </div>
                  </Field>
                </div>
                {/* Preview */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-3">Brand Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: brandForm.primaryColor }}>
                      {brandForm.brandName?.[0]?.toUpperCase() ?? 'E'}
                    </div>
                    <span className="font-semibold text-gray-900">{brandForm.brandName || 'EduAI'}</span>
                    <button className="ml-auto px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: brandForm.primaryColor }}>
                      Sign Up
                    </button>
                    <button className="px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: brandForm.secondaryColor }}>
                      Learn More
                    </button>
                  </div>
                </div>
                <Button onClick={() => brandMutation.mutate(brandForm)} disabled={brandMutation.isPending}>
                  {brandMutation.isPending ? 'Saving...' : 'Save Branding'}
                </Button>
                {brandMutation.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1.5"><Check className="h-4 w-4" />Branding saved</p>}
              </CardContent>
            </Card>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <Card>
              <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  Keep your API keys secret. Never share them or commit them to source control.
                </div>
                {showKey && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-700 mb-1">New key created — copy it now, it won't be shown again:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-green-800 break-all flex-1">{showKey}</code>
                      <button onClick={() => { void navigator.clipboard.writeText(showKey); toast.success('Copied'); }}
                        className="text-green-600 hover:text-green-800 flex-shrink-0">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Key name (e.g. Production Integration)"
                    value={newKeyForm.name}
                    onChange={e => setNewKeyForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <Button onClick={() => createKeyMutation.mutate(newKeyForm)} disabled={createKeyMutation.isPending} className="flex-shrink-0">
                    Create Key
                  </Button>
                </div>
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Scopes</p>
                  <div className="flex flex-wrap gap-2">
                    {SCOPE_OPTIONS.map(scope => (
                      <label key={scope} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyForm.scopes.includes(scope)}
                          onChange={e => setNewKeyForm(f => ({
                            ...f,
                            scopes: e.target.checked ? [...f.scopes, scope] : f.scopes.filter(s => s !== scope),
                          }))}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="capitalize">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {(apiKeys ?? []).map((key: { id: string; name: string; keyPrefix?: string; scopes?: string[]; rateLimit?: number; lastUsedAt?: string }) => (
                    <div key={key.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{key.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{key.keyPrefix}••••••••••••</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {key.scopes?.join(', ')} · {key.rateLimit}/hr
                          {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => revokeKeyMutation.mutate(key.id)}>Revoke</Button>
                    </div>
                  ))}
                  {!apiKeys?.length && <p className="py-6 text-sm text-gray-400 text-center">No API keys yet. Create one above.</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
