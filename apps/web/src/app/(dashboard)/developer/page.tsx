'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Check, Copy, ExternalLink, Key, Shield, Zap } from 'lucide-react';
import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPES_DOC = [
  { scope: 'read:courses',      description: 'List and read course content, sections, and lessons.' },
  { scope: 'write:courses',     description: 'Create, update, and publish courses.' },
  { scope: 'read:users',        description: 'Read user profiles and basic account info.' },
  { scope: 'write:enrollments', description: 'Enroll or unenroll users in courses.' },
  { scope: 'read:analytics',    description: 'Access usage analytics and reporting data.' },
  { scope: 'admin:all',         description: 'Full access to all API resources (use with care).' },
];

const RATE_LIMITS = [
  { plan: 'Free Trial',    limit: '500 req / hour' },
  { plan: 'Starter',       limit: '1,000 req / hour' },
  { plan: 'Professional',  limit: '5,000 req / hour' },
  { plan: 'Business',      limit: '20,000 req / hour' },
  { plan: 'Enterprise',    limit: 'Custom / unlimited' },
];

const SNIPPETS = [
  {
    label: 'List courses (curl)',
    lang: 'bash',
    code: `curl -H "X-API-Key: eak_YOUR_KEY" \\
  https://api.eduai.app/v1/courses`,
  },
  {
    label: 'List courses (JavaScript)',
    lang: 'js',
    code: `const res = await fetch('https://api.eduai.app/v1/courses', {
  headers: { 'X-API-Key': 'eak_YOUR_KEY' }
});
const { data } = await res.json();`,
  },
  {
    label: 'Enroll a user (curl)',
    lang: 'bash',
    code: `curl -X POST https://api.eduai.app/v1/enrollments \\
  -H "X-API-Key: eak_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"courseId":"<course-id>","userId":"<user-id>"}'`,
  },
];

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="absolute top-3 right-3 p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative">
      <pre className={cn(
        'rounded-lg bg-gray-900 text-gray-100 p-4 pr-12 text-sm font-mono overflow-x-auto',
        lang === 'bash' && 'text-green-300',
      )}>
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeveloperPortalPage() {
  const [activeSnippet, setActiveSnippet] = useState(0);

  const { data: keys = [] } = useQuery<ApiKeyItem[]>({
    queryKey: ['user-api-keys'],
    queryFn: () => api.get('/api-ecosystem/api-keys').then(r => r.data?.data ?? r.data),
  });

  const activeKeys = keys.filter(k => k.isActive);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Developer Portal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Integrate EduAI into your applications using our REST API.
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Authenticate every request by passing your API key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code> header
            or as a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Bearer</code> token.
          </p>

          {/* Snippet tabs */}
          <div className="flex gap-2 flex-wrap">
            {SNIPPETS.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSnippet(i)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  activeSnippet === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <CodeBlock code={SNIPPETS[activeSnippet].code} lang={SNIPPETS[activeSnippet].lang} />

          <p className="text-xs text-gray-400">
            Replace <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">eak_YOUR_KEY</code> with an actual key from{' '}
            <a href="/settings/api-keys" className="text-blue-600 hover:underline">Settings → API Keys</a>.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scopes documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Available Scopes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {SCOPES_DOC.map(row => (
                  <tr key={row.scope} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {row.scope}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Rate limits are enforced per API key, per hour. Exceeding the limit returns HTTP 429.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RATE_LIMITS.map(row => (
                  <tr key={row.plan} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.plan}</td>
                    <td className="px-4 py-3 text-gray-600">{row.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Your Keys Quick List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Your Active API Keys
            </CardTitle>
            <a
              href="/settings/api-keys"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Manage keys
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {activeKeys.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No active API keys.{' '}
              <a href="/settings/api-keys" className="text-blue-600 hover:underline">
                Create one
              </a>{' '}
              to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {activeKeys.map(key => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{key.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{key.keyPrefix}••••••••</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {key.scopes.slice(0, 3).map(s => (
                      <span
                        key={s}
                        className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                    {key.scopes.length > 3 && (
                      <span className="text-xs text-gray-400">+{key.scopes.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Docs Link */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium text-gray-900">Full API Reference</p>
            <p className="text-sm text-gray-500">Explore all endpoints, request/response schemas, and error codes.</p>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Open Swagger Docs
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
