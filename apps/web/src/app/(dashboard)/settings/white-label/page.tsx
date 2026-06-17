'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Palette, Save } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from '@/hooks/useToast';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandingConfigV2 {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  brandName: string;
  tagline?: string;
  fontFamily?: string;
  borderRadius?: 'sharp' | 'rounded' | 'pill';
  darkModeEnabled?: boolean;
}

interface WhiteLabelConfig {
  tenantId: string;
  branding: BrandingConfigV2;
  customDomain?: string;
  hideEduAIBranding: boolean;
  features: Record<string, boolean>;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
];

const BORDER_RADIUS_OPTIONS: { value: BrandingConfigV2['borderRadius']; label: string }[] = [
  { value: 'sharp', label: 'Sharp (0px)' },
  { value: 'rounded', label: 'Rounded (8px)' },
  { value: 'pill', label: 'Pill (9999px)' },
];

const DEFAULT_BRANDING: BrandingConfigV2 = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4',
  brandName: 'EduAI',
  tagline: '',
  logoUrl: '',
  faviconUrl: '',
  fontFamily: 'Inter',
  borderRadius: 'rounded',
  darkModeEnabled: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToPreviewStyle(color: string) {
  return { backgroundColor: color };
}

function borderRadiusValue(br: BrandingConfigV2['borderRadius']) {
  if (br === 'sharp') return '0';
  if (br === 'pill') return '9999px';
  return '8px';
}

// ─── ColorInput ───────────────────────────────────────────────────────────────

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-gray-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <div
          className="h-9 w-9 rounded border border-gray-200 flex-shrink-0"
          style={hexToPreviewStyle(value)}
        />
      </div>
    </div>
  );
}

// ─── LivePreviewPanel ─────────────────────────────────────────────────────────

function LivePreviewPanel({ branding }: { branding: BrandingConfigV2 }) {
  const radius = borderRadiusValue(branding.borderRadius);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Live Preview</p>

      {/* Mock header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{ backgroundColor: branding.primaryColor, borderRadius: radius, fontFamily: branding.fontFamily }}
      >
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
        ) : (
          <div
            className="h-7 w-7 flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: branding.accentColor, borderRadius: radius }}
          >
            {(branding.brandName || 'E')[0]?.toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-base">{branding.brandName || 'Your Brand'}</span>
        {branding.tagline && (
          <span className="ml-auto text-xs opacity-80 hidden sm:block">{branding.tagline}</span>
        )}
      </div>

      {/* Mock CTA buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: branding.primaryColor, borderRadius: radius, fontFamily: branding.fontFamily }}
        >
          Primary Action
        </button>
        <button
          className="px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: branding.secondaryColor, borderRadius: radius, fontFamily: branding.fontFamily }}
        >
          Secondary
        </button>
        <button
          className="px-4 py-2 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: branding.accentColor, borderRadius: radius, fontFamily: branding.fontFamily }}
        >
          Accent
        </button>
      </div>

      {/* Mock card */}
      <div
        className="border border-gray-200 bg-white p-4 shadow-sm"
        style={{ borderRadius: radius, fontFamily: branding.fontFamily }}
      >
        <h3
          className="font-semibold text-sm mb-1"
          style={{ color: branding.primaryColor }}
        >
          Sample Course Card
        </h3>
        <p className="text-xs text-gray-500">
          Introduction to Machine Learning · 12 lessons
        </p>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full w-2/3"
            style={{ backgroundColor: branding.accentColor }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">67% complete</p>
      </div>

      {/* CSS preview */}
      <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-green-400 leading-relaxed">
        <span className="text-purple-400">:root</span>{' {'}
        <br />
        {'  '}<span className="text-blue-400">--primary</span>:{' '}
        <span className="text-yellow-300">{branding.primaryColor}</span>;
        <br />
        {'  '}<span className="text-blue-400">--secondary</span>:{' '}
        <span className="text-yellow-300">{branding.secondaryColor}</span>;
        <br />
        {'  '}<span className="text-blue-400">--accent</span>:{' '}
        <span className="text-yellow-300">{branding.accentColor}</span>;
        <br />
        {'}'}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhiteLabelSettingsPage() {
  const [branding, setBranding] = useState<BrandingConfigV2>(DEFAULT_BRANDING);
  const [customDomain, setCustomDomain] = useState('');
  const [domainError, setDomainError] = useState('');

  // ── Fetch existing config ──────────────────────────────────────────────────
  const { data: config } = useQuery<WhiteLabelConfig>({
    queryKey: ['white-label-config'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await api.get<{ data: WhiteLabelConfig }>('/white-label/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data.data ?? res.data;
    },
  });

  useEffect(() => {
    if (config) {
      setBranding({ ...DEFAULT_BRANDING, ...config.branding });
      setCustomDomain(config.customDomain ?? '');
    }
  }, [config]);

  // ── Save branding mutation ─────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<BrandingConfigV2>) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await api.patch('/white-label/branding', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Branding saved', 'Your white-label branding has been updated.');
    },
    onError: () => {
      toast.error('Save failed', 'Could not save branding. Please try again.');
    },
  });

  // ── Save domain mutation ───────────────────────────────────────────────────
  const domainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await api.patch('/white-label/domain', { domain }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      toast.success('Domain saved', 'Custom domain has been updated.');
      setDomainError('');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid domain format';
      setDomainError(msg);
      toast.error('Domain error', msg);
    },
  });

  function handleSaveBranding() {
    saveMutation.mutate(branding);
  }

  function handleSaveDomain() {
    const DOMAIN_REGEX = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (customDomain && !DOMAIN_REGEX.test(customDomain.trim())) {
      setDomainError('Use format: example.com');
      return;
    }
    setDomainError('');
    domainMutation.mutate(customDomain.trim());
  }

  function update(field: keyof BrandingConfigV2, value: unknown) {
    setBranding((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="h-6 w-6 text-indigo-600" />
            White Label &amp; Branding
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Customize your platform's look and feel for your organization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Form ───────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorInput
                label="Primary Color"
                value={branding.primaryColor}
                onChange={(v) => update('primaryColor', v)}
              />
              <ColorInput
                label="Secondary Color"
                value={branding.secondaryColor}
                onChange={(v) => update('secondaryColor', v)}
              />
              <ColorInput
                label="Accent Color"
                value={branding.accentColor}
                onChange={(v) => update('accentColor', v)}
              />
            </CardContent>
          </Card>

          {/* Brand Info */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={labelClass}>Brand Name</label>
                <input
                  type="text"
                  value={branding.brandName}
                  onChange={(e) => update('brandName', e.target.value)}
                  className={inputClass}
                  placeholder="Your Organization"
                />
              </div>
              <div>
                <label className={labelClass}>Tagline</label>
                <input
                  type="text"
                  value={branding.tagline ?? ''}
                  onChange={(e) => update('tagline', e.target.value)}
                  className={inputClass}
                  placeholder="Empowering learners everywhere"
                />
              </div>
              <div>
                <label className={labelClass}>Logo URL</label>
                <input
                  type="text"
                  value={branding.logoUrl ?? ''}
                  onChange={(e) => update('logoUrl', e.target.value)}
                  className={inputClass}
                  placeholder="https://cdn.example.com/logo.png"
                />
              </div>
              <div>
                <label className={labelClass}>Favicon URL</label>
                <input
                  type="text"
                  value={branding.faviconUrl ?? ''}
                  onChange={(e) => update('faviconUrl', e.target.value)}
                  className={inputClass}
                  placeholder="https://cdn.example.com/favicon.ico"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={labelClass}>Font Family</label>
                <select
                  value={branding.fontFamily ?? 'Inter'}
                  onChange={(e) => update('fontFamily', e.target.value)}
                  className={inputClass}
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Border Radius</label>
                <select
                  value={branding.borderRadius ?? 'rounded'}
                  onChange={(e) =>
                    update('borderRadius', e.target.value as BrandingConfigV2['borderRadius'])
                  }
                  className={inputClass}
                >
                  {BORDER_RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                  <p className="text-xs text-gray-500">Enable dark theme as default</p>
                </div>
                <button
                  type="button"
                  onClick={() => update('darkModeEnabled', !branding.darkModeEnabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none ${
                    branding.darkModeEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${
                      branding.darkModeEnabled ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className={labelClass}>Domain</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => {
                    setCustomDomain(e.target.value);
                    setDomainError('');
                  }}
                  className={`${inputClass} ${domainError ? 'border-red-300 focus:ring-red-400' : ''}`}
                  placeholder="app.yourschool.com"
                />
                {domainError ? (
                  <p className="text-xs text-red-600 mt-1">{domainError}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Format: subdomain.example.com — must point to our servers via CNAME.
                  </p>
                )}
              </div>
              <Button
                onClick={handleSaveDomain}
                disabled={domainMutation.isPending}
                variant="outline"
                size="sm"
              >
                {domainMutation.isPending ? 'Saving...' : 'Save Domain'}
              </Button>
            </CardContent>
          </Card>

          {/* Save branding */}
          <Button
            onClick={handleSaveBranding}
            disabled={saveMutation.isPending}
            className="w-full gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>

        {/* ── Right: Live Preview ───────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <LivePreviewPanel branding={branding} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
