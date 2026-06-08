'use client';

import React, { useEffect, useState } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'eduai_cookie_consent';
const VERSION = '1.0';

interface CookiePrefs {
  necessary: boolean;  // always true
  analytics: boolean;
  marketing: boolean;
  version: string;
  savedAt: string;
}

function getStored(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocally(prefs: Omit<CookiePrefs, 'savedAt'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, savedAt: new Date().toISOString() }));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    const stored = getStored();
    if (!stored || stored.version !== VERSION) {
      // Delay slightly so page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  async function persistConsents(prefs: { analytics: boolean; marketing: boolean }) {
    saveLocally({ necessary: true, analytics: prefs.analytics, marketing: prefs.marketing, version: VERSION });
    if (isAuthenticated) {
      await api.put('/gdpr/consents', {
        consents: [
          { type: 'COOKIES_NECESSARY', granted: true, version: VERSION },
          { type: 'COOKIES_ANALYTICS', granted: prefs.analytics, version: VERSION },
          { type: 'COOKIES_MARKETING', granted: prefs.marketing, version: VERSION },
        ],
      }).catch(() => {/* non-blocking */});
    }
  }

  async function acceptAll() {
    await persistConsents({ analytics: true, marketing: true });
    setVisible(false);
  }

  async function acceptNecessary() {
    await persistConsents({ analytics: false, marketing: false });
    setVisible(false);
  }

  async function saveCustom() {
    await persistConsents({ analytics, marketing });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-900/10">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
              <Cookie className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">We use cookies</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                We use cookies to improve your experience, personalise content, and analyse traffic.
                You can choose which cookies to allow below.
              </p>
            </div>
            <button onClick={acceptNecessary} className="flex-shrink-0 text-gray-400 hover:text-gray-600 -mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Expanded controls */}
          {expanded && (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              {[
                {
                  key: 'necessary',
                  label: 'Necessary',
                  desc: 'Required for the platform to function (auth, security). Cannot be disabled.',
                  value: true,
                  disabled: true,
                },
                {
                  key: 'analytics',
                  label: 'Analytics',
                  desc: 'Help us understand how you use the platform so we can improve it.',
                  value: analytics,
                  disabled: false,
                  onChange: setAnalytics,
                },
                {
                  key: 'marketing',
                  label: 'Marketing',
                  desc: 'Allow us to show personalised content and recommendations.',
                  value: marketing,
                  disabled: false,
                  onChange: setMarketing,
                },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    disabled={item.disabled}
                    onClick={() => !item.disabled && item.onChange?.(!item.value)}
                    className={cn(
                      'relative flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors focus:outline-none',
                      item.value ? 'bg-blue-600' : 'bg-gray-200',
                      item.disabled && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      item.value ? 'translate-x-4' : 'translate-x-0',
                    )} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={acceptAll}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accept all
            </button>
            {expanded ? (
              <button
                onClick={saveCustom}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Save preferences
              </button>
            ) : (
              <button
                onClick={acceptNecessary}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Necessary only
              </button>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <Shield className="h-3 w-3" />
              {expanded ? 'Less' : 'Manage'} preferences
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
