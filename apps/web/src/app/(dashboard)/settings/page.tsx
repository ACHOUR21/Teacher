'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Palette, Bell, Shield, Key, Building, Eye, EyeOff, Check,
  AlertTriangle, BellRing, BellOff, Smartphone, Copy, Download, RefreshCw,
  Trash2, Lock, FileText, AlertOctagon,
} from 'lucide-react';
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

type Tab = 'profile' | 'general' | 'security' | 'notifications' | 'branding' | 'api';

const TABS: { id: Tab; labelKey: string; icon: React.ComponentType<any> }[] = [
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

  if (status === 'unconfigured') {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <BellOff className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-700">Firebase is not configured. Set the <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_FIREBASE_*</code> environment variables to enable push notifications.</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
        <BellOff className="h-5 w-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">Notifications are blocked. Please enable them in your browser settings and reload.</p>
      </div>
    );
  }

  const isGranted = status === 'granted';
  const isLoading = status === 'loading';

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {isGranted
          ? <BellRing className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          : <BellOff className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
        }
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isGranted ? 'Push notifications enabled' : 'Push notifications disabled'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isGranted
              ? 'You will receive browser notifications for important updates.'
              : 'Enable to get instant alerts even when the tab is in the background.'}
          </p>
        </div>
      </div>
      <button
        onClick={isGranted ? disable : enable}
        disabled={isLoading}
        className={cn(
          'relative flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50',
          isGranted ? 'bg-blue-600' : 'bg-gray-200',
        )}
        aria-label={isGranted ? 'Disable push notifications' : 'Enable push notifications'}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          isGranted ? 'translate-x-4' : 'translate-x-0',
        )} />
      </button>
    </div>
  );
}

type MfaStep = 'idle' | 'qr' | 'verify' | 'codes';

function MfaSection({ mfaEnabled }: { mfaEnabled: boolean }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<MfaStep>('idle');
  const [qrData, setQrData] = useState<{ qrCodeUrl: string; secret: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpInput, setTotpInput] = useState('');
  const [totpError, setTotpError] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [showRegen, setShowRegen] = useState(false);
  const [regenCodes, setRegenCodes] = useState<string[]>([]);

  const setupMutation = useMutation({
    mutationFn: () => api.post('/auth/mfa/setup').then(r => r.data.data ?? r.data),
    onSuccess: (data) => {
      setQrData({ qrCodeUrl: data.qrCodeUrl, secret: data.secret });
      setStep('qr');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (token: string) => api.post('/auth/mfa/verify', { token }).then(r => r.data.data ?? r.data),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes ?? []);
      qc.invalidateQueries({ queryKey: ['me'] });
      setStep('codes');
      setTotpInput('');
    },
    onError: () => setTotpError('Invalid code — check your authenticator app'),
  });

  const disableMutation = useMutation({
    mutationFn: () => api.post('/auth/mfa/disable', { token: disableToken, password: disablePassword }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setShowDisable(false);
      setStep('idle');
      toast.success('Two-factor authentication disabled');
    },
    onError: (err: any) => setDisableError(err?.response?.data?.message ?? 'Invalid token or password'),
  });

  const regenMutation = useMutation({
    mutationFn: () => api.post('/auth/mfa/backup-codes/regenerate', { password: regenPassword }).then(r => r.data.data ?? r.data),
    onSuccess: (data) => {
      setRegenCodes(data.backupCodes ?? []);
      setShowRegen(false);
      setRegenPassword('');
      toast.success('Backup codes regenerated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Invalid password'),
  });

  function copyCodesText(codes: string[]) {
    navigator.clipboard.writeText(codes.join('\n'));
    toast.success('Copied to clipboard');
  }

  function downloadCodes(codes: string[]) {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eduai-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Backup codes display (used after setup and after regen)
  const _displayCodes = regenCodes.length > 0 ? regenCodes : backupCodes;

  if (step === 'qr' && qrData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
          <Lock className="h-4 w-4 flex-shrink-0" />
          Step 1 of 2 — Scan this QR code with Google Authenticator, Authy, or 1Password.
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* QR Code */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex-shrink-0">
            <img src={qrData.qrCodeUrl} alt="MFA QR code" className="w-48 h-48" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Can't scan? Enter this secret manually:</p>
              <code className="block text-xs bg-gray-100 px-3 py-2 rounded-lg font-mono break-all text-gray-700">
                {qrData.secret}
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter the 6-digit code from your app</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={totpInput}
                onChange={e => { setTotpInput(e.target.value.replace(/\D/g, '')); setTotpError(''); }}
                className="font-mono tracking-widest text-center text-lg"
              />
              {totpError && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{totpError}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => verifyMutation.mutate(totpInput)}
                loading={verifyMutation.isPending}
                disabled={totpInput.length < 6}
              >
                Verify &amp; Enable
              </Button>
              <Button variant="outline" onClick={() => { setStep('idle'); setQrData(null); }}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'codes') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          <Check className="h-4 w-4 flex-shrink-0" />
          Two-factor authentication is now enabled! Save your backup codes in a safe place.
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Backup codes can be used to access your account if you lose your authenticator app.
            Each code can only be used <strong>once</strong>.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-gray-800 tracking-wider">{code}</code>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => copyCodesText(backupCodes)}>
              <Copy className="h-4 w-4 mr-1.5" />Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadCodes(backupCodes)}>
              <Download className="h-4 w-4 mr-1.5" />Download
            </Button>
          </div>
        </div>
        <Button onClick={() => setStep('idle')}>Done</Button>
      </div>
    );
  }

  // Idle state — MFA enabled or disabled
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Smartphone className={cn('h-5 w-5 mt-0.5 flex-shrink-0', mfaEnabled ? 'text-green-600' : 'text-gray-400')} />
          <div>
            <p className="text-sm font-medium text-gray-900">Authenticator App (TOTP)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {mfaEnabled
                ? 'MFA is active. Your account is protected with a time-based one-time password.'
                : 'Use Google Authenticator, Authy, or 1Password for time-based codes.'}
            </p>
          </div>
        </div>
        {mfaEnabled ? (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-medium">
            <Check className="h-3 w-3" /> Enabled
          </span>
        ) : (
          <Button size="sm" onClick={() => setupMutation.mutate()} loading={setupMutation.isPending}>
            Enable MFA
          </Button>
        )}
      </div>

      {mfaEnabled && (
        <div className="pl-8 space-y-3 border-l-2 border-gray-100 ml-2">
          {/* Regen backup codes */}
          {regenCodes.length > 0 ? (
            <div>
              <p className="text-xs text-gray-600 mb-2">New backup codes (save these now):</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {regenCodes.map((code, i) => (
                    <code key={i} className="text-xs font-mono text-gray-700 tracking-wider">{code}</code>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => copyCodesText(regenCodes)}>
                  <Copy className="h-3.5 w-3.5 mr-1" />Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadCodes(regenCodes)}>
                  <Download className="h-3.5 w-3.5 mr-1" />Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRegenCodes([])}>Dismiss</Button>
              </div>
            </div>
          ) : showRegen ? (
            <div className="flex gap-2 items-center">
              <Input
                type="password"
                placeholder="Confirm your password"
                value={regenPassword}
                onChange={e => setRegenPassword(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={() => regenMutation.mutate()} loading={regenMutation.isPending} disabled={!regenPassword}>
                Regenerate
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowRegen(false); setRegenPassword(''); }}>Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowRegen(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />Regenerate backup codes
            </button>
          )}

          {/* Disable MFA */}
          {showDisable ? (
            <div className="space-y-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-medium text-red-700">Enter your TOTP code and password to disable MFA:</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={disableToken}
                  onChange={e => { setDisableToken(e.target.value.replace(/\D/g, '')); setDisableError(''); }}
                  className="font-mono tracking-widest text-center flex-1"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={disablePassword}
                  onChange={e => setDisablePassword(e.target.value)}
                  className="flex-1"
                />
              </div>
              {disableError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{disableError}</p>}
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => disableMutation.mutate()} loading={disableMutation.isPending}>
                  Disable MFA
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowDisable(false); setDisableError(''); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDisable(true)}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />Disable two-factor authentication
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TrustedDevicesSection() {
  const qc = useQueryClient();
  const { data: devices = [] } = useQuery<any[]>({
    queryKey: ['auth-devices'],
    queryFn: () => api.get('/auth/devices').then(r => r.data.data ?? r.data ?? []),
  });

  const revokeMutation = useMutation({
    mutationFn: (deviceId: string) => api.delete(`/auth/devices/${deviceId}/trust`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-devices'] }),
  });

  const trusted = devices.filter((d) => d.mfaTrusted && d.mfaTrustedUntil && new Date(d.mfaTrustedUntil) > new Date());

  if (trusted.length === 0) {return null;}

  return (
    <Card>
      <CardHeader><CardTitle>Trusted Devices</CardTitle></CardHeader>
      <CardContent>
        <p className="text-xs text-gray-500 mb-3">These devices skip MFA for 30 days after you checked &quot;Trust this device&quot; during login.</p>
        <div className="divide-y divide-gray-100">
          {trusted.map((device: any) => (
            <div key={device.id} className="py-2.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{device.deviceName ?? device.deviceId}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Trusted until {new Date(device.mfaTrustedUntil).toLocaleDateString()}
                  {' · '}Last seen {new Date(device.lastSeenAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeMutation.mutate(device.deviceId)}
                loading={revokeMutation.isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── GDPR Privacy & Data Card ──────────────────────────────────────────────────

const CONSENT_LABELS: Record<string, { label: string; desc: string }> = {
  MARKETING_EMAIL: { label: 'Marketing emails', desc: 'Receive product updates, offers, and newsletters.' },
  ANALYTICS: { label: 'Usage analytics', desc: 'Help us improve by sharing anonymous usage data.' },
  COOKIES_ANALYTICS: { label: 'Analytics cookies', desc: 'Track visits and usage patterns within the platform.' },
  COOKIES_MARKETING: { label: 'Marketing cookies', desc: 'Personalised content and recommendations.' },
};

function GdprPrivacyCard() {
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: consents = [] } = useQuery<any[]>({
    queryKey: ['gdpr-consents'],
    queryFn: () => api.get('/gdpr/consents').then(r => r.data.data ?? r.data ?? []),
  });

  const { data: deletionReq, refetch: refetchDeletion } = useQuery<any>({
    queryKey: ['gdpr-deletion'],
    queryFn: () => api.get('/gdpr/deletion-request').then(r => r.data.data ?? r.data).catch(() => null),
  });

  const consentMap = Object.fromEntries((consents).map((c: any) => [c.type, c.granted as boolean]));

  const consentMutation = useMutation({
    mutationFn: (updates: { type: string; granted: boolean }[]) =>
      api.put('/gdpr/consents', { consents: updates.map(u => ({ ...u, version: '1.0' })) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gdpr-consents'] }); toast.success('Preferences saved'); },
  });

  const requestDeleteMutation = useMutation({
    mutationFn: () => api.post('/gdpr/deletion-request', { reason: deleteReason || undefined }),
    onSuccess: () => { refetchDeletion(); setConfirmDelete(false); toast.success('Deletion scheduled — you have 30 days to cancel'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Request failed'),
  });

  const cancelDeleteMutation = useMutation({
    mutationFn: () => api.delete('/gdpr/deletion-request'),
    onSuccess: () => { refetchDeletion(); toast.success('Account deletion cancelled'); },
  });

  async function handleExport() {
    setExporting(true);
    try {
      const res = await api.get('/gdpr/export');
      const data = res.data.data ?? res.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eduai-my-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }

  const hasPendingDeletion = deletionReq?.status === 'PENDING';

  return (
    <Card>
      <CardHeader><CardTitle>Privacy &amp; Data (GDPR)</CardTitle></CardHeader>
      <CardContent className="space-y-6">

        {/* Data Export */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Download My Data</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Export a copy of all personal data we hold about you (GDPR Article 15 &amp; 20 — right to access &amp; portability). JSON format.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} loading={exporting} className="flex-shrink-0">
            <Download className="h-3.5 w-3.5 mr-1.5" />Download
          </Button>
        </div>

        {/* Consent Preferences */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-gray-900 mb-3">Consent Preferences</p>
          <div className="space-y-3">
            {Object.entries(CONSENT_LABELS).map(([type, meta]) => {
              const granted = consentMap[type] ?? false;
              return (
                <div key={type} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-700">{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                  </div>
                  <button
                    onClick={() => consentMutation.mutate([{ type, granted: !granted }])}
                    className={cn(
                      'relative flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
                      granted ? 'bg-blue-600' : 'bg-gray-200',
                    )}
                    aria-label={`Toggle ${meta.label}`}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      granted ? 'translate-x-4' : 'translate-x-0',
                    )} />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Necessary cookies are always active and cannot be disabled. You can withdraw other consents at any time without affecting the lawfulness of past processing.
          </p>
        </div>

        {/* Account Deletion */}
        <div className="border-t border-gray-100 pt-5">
          {hasPendingDeletion ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">Account deletion scheduled</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Your account and all personal data will be permanently deleted on{' '}
                    <strong>{new Date(deletionReq.scheduledFor).toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>.
                    This action cannot be undone after that date.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelDeleteMutation.mutate()}
                    loading={cancelDeleteMutation.isPending}
                    className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Cancel deletion
                  </Button>
                </div>
              </div>
            </div>
          ) : confirmDelete ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Are you sure?</p>
              <p className="text-xs text-red-600">
                Requesting deletion will disable your account immediately. After a 30-day grace period, all
                personal data will be permanently erased. You can cancel any time within those 30 days.
              </p>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Optional: tell us why you're leaving..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => requestDeleteMutation.mutate()}
                  loading={requestDeleteMutation.isPending}
                >
                  Yes, delete my account
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Delete My Account</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permanently delete your account and all associated data (GDPR Article 17 — right to erasure).
                    A 30-day grace period applies.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50"
              >
                Delete Account
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', bio: '', phone: '' });
  const [brandForm, setBrandForm] = useState({ brandName: '', primaryColor: '#2563EB', secondaryColor: '#7C3AED' });
  const [newKeyForm, setNewKeyForm] = useState({ name: '', scopes: ['read'] });
  const [notifPrefs, setNotifPrefs] = useState({
    emailCourseUpdates: true, emailAssignments: true, emailLive: true,
    pushAll: true, pushMentions: true,
  });
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  const { data: me } = useQuery<any>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => {
      const d = r.data.data;
      setProfileForm({
        firstName: d.firstName ?? '',
        lastName: d.lastName ?? '',
        email: d.email ?? '',
        bio: d.bio ?? '',
        phone: d.phone ?? '',
      });
      if (d.language) {setLanguage(d.language);}
      if (d.timezone) {setTimezone(d.timezone);}
      return d;
    }),
  });

  const { data: wlSettings } = useQuery<any>({
    queryKey: ['white-label'],
    queryFn: () => api.get('/white-label/settings').then(r => {
      const d = r.data.data;
      if (d) {setBrandForm({ brandName: d.brandName ?? '', primaryColor: d.primaryColor ?? '#2563EB', secondaryColor: d.secondaryColor ?? '#7C3AED' });}
      return d;
    }),
  });

  const { data: apiKeys, refetch: refetchKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-ecosystem/keys').then(r => r.data.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/auth/sessions').then(r => r.data.data),
    enabled: activeTab === 'security',
  });

  const profileMutation = useMutation({
    mutationFn: (dto: any) => api.patch('/users/me', dto).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const prefsMutation = useMutation({
    mutationFn: (dto: { language: string; timezone: string }) =>
      api.patch('/users/me', dto).then(r => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['me'] });
      if (['en', 'fr', 'ar'].includes(vars.language)) {
        setLocale(vars.language as Locale);
      }
      toast.success('Preferences saved');
    },
  });

  const brandMutation = useMutation({
    mutationFn: (dto: any) => api.put('/white-label/settings', dto).then(r => r.data.data),
  });

  const createKeyMutation = useMutation({
    mutationFn: (dto: any) => api.post('/api-ecosystem/keys', dto).then(r => r.data.data),
    onSuccess: () => { refetchKeys(); setNewKeyForm({ name: '', scopes: ['read'] }); },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-ecosystem/keys/${id}`).then(r => r.data.data),
    onSuccess: () => refetchKeys(),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const changePwMutation = useMutation({
    mutationFn: (dto: any) => api.post('/auth/change-password', dto).then(r => r.data.data),
    onSuccess: () => {
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    },
    onError: (err: any) => setPwError(err?.response?.data?.message ?? 'Failed to change password'),
  });

  function handleChangePw() {
    setPwError('');
    if (pwForm.newPassword.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match'); return; }
    changePwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  }

  const SCOPE_OPTIONS = ['read', 'write', 'admin', 'webhooks'];

  // Suppress unused warning — wlSettings is consumed by setBrandForm side-effect inside queryFn
  void wlSettings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and platform configuration</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-52 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap',
                  activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {t(`tabs.${tab.labelKey}` as any)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {(profileForm.firstName?.[0] ?? me?.firstName?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{me?.firstName} {me?.lastName}</p>
                    <p className="text-sm text-gray-500">{me?.email}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{me?.role?.replace('_', ' ').toLowerCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First Name">
                    <Input value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                  </Field>
                  <Field label="Last Name">
                    <Input value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Email Address">
                  <Input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
                </Field>
                <Field label="Phone">
                  <Input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" />
                </Field>
                <Field label="Bio">
                  <textarea
                    value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell students about yourself..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </Field>
                <Button onClick={() => profileMutation.mutate(profileForm)} loading={profileMutation.isPending}>
                  Save Profile
                </Button>
                {profileMutation.isSuccess && (
                  <p className="text-sm text-green-600 flex items-center gap-1.5"><Check className="h-4 w-4" />Profile updated successfully</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Institution Name">
                  <Input placeholder="Your institution name" defaultValue={me?.tenant?.name ?? ''} />
                </Field>
                <Field label={t('general.language')}>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                    <option value="de">German</option>
                  </select>
                </Field>
                <Field label="Timezone">
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Asia/Karachi">Asia/Karachi</option>
                    <option value="Africa/Algiers">Africa/Algiers</option>
                  </select>
                </Field>
                <Field label="Academic Year Format">
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Sep – Jun (Northern Hemisphere)</option>
                    <option>Jan – Dec (Calendar Year)</option>
                    <option>Mar – Feb (Southern Hemisphere)</option>
                  </select>
                </Field>
                <Button
                  onClick={() => prefsMutation.mutate({ language, timezone })}
                  loading={prefsMutation.isPending}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showOldPw ? 'text' : 'password'}
                      placeholder="Current password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                    />
                    <button onClick={() => setShowOldPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOldPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="New password (min. 8 characters)"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    />
                    <button onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {pwForm.newPassword.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[8, 12, 16, 20].map(len => (
                          <div key={len} className={cn('h-1 flex-1 rounded-full transition-colors',
                            pwForm.newPassword.length >= len ? 'bg-green-500' : 'bg-gray-200'
                          )} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {pwForm.newPassword.length < 8 ? 'Too short' :
                         pwForm.newPassword.length < 12 ? 'Weak' :
                         pwForm.newPassword.length < 16 ? 'Good' : 'Strong'}
                      </p>
                    </div>
                  )}
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                  {pwError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />{pwError}</p>
                  )}
                  {pwSuccess && (
                    <p className="text-sm text-green-600 flex items-center gap-1.5"><Check className="h-4 w-4" />Password changed successfully</p>
                  )}
                  <Button onClick={handleChangePw} loading={changePwMutation.isPending}>Update Password</Button>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader><CardTitle>Two-Factor Authentication</CardTitle></CardHeader>
                <CardContent>
                  <MfaSection mfaEnabled={me?.mfaEnabled ?? false} />
                </CardContent>
              </Card>

              {/* Trusted Devices */}
              <TrustedDevicesSection />

              <Card>
                <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(sessions ?? []).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {s.device ?? 'Unknown device'}
                            {s.isCurrent && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Current</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{s.ipAddress} · Last active {new Date(s.lastActivity ?? s.createdAt).toLocaleDateString()}</p>
                        </div>
                        {!s.isCurrent && (
                          <Button variant="ghost" size="sm" onClick={() => revokeSessionMutation.mutate(s.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                    {!sessions?.length && <p className="text-sm text-gray-400 py-2">No active sessions found</p>}
                  </div>
                </CardContent>
              </Card>

              <GdprPrivacyCard />
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
                  <p className="text-xs text-gray-500 mb-4">Get instant alerts in your browser, even when the tab is in the background.</p>
                  <PushNotificationToggle />
                </div>

                <Button onClick={() => api.patch('/users/me/notifications', notifPrefs)}>Save Preferences</Button>
              </CardContent>
            </Card>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <Card>
              <CardHeader><CardTitle>White Label Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
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
                <Button onClick={() => brandMutation.mutate(brandForm)} loading={brandMutation.isPending}>Save Branding</Button>
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Key name (e.g. Production Integration)"
                    value={newKeyForm.name}
                    onChange={e => setNewKeyForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <Button onClick={() => createKeyMutation.mutate(newKeyForm)} loading={createKeyMutation.isPending} className="flex-shrink-0">
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
                  {(apiKeys ?? []).map((key: any) => (
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
