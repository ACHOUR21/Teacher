'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';


interface ImpersonationInfo {
  email: string;
  firstName: string;
  lastName: string;
  tenantName?: string;
}

/**
 * Shows a prominent orange banner when the current session is an impersonation.
 * The banner reads the `isImpersonation` flag from the auth store user payload,
 * or falls back to sessionStorage for impersonation tokens set by the tenant
 * impersonate flow (which stores the token separately without full login).
 */
export function ImpersonationBanner() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [impersonationInfo, setImpersonationInfo] = useState<ImpersonationInfo | null>(null);

  useEffect(() => {
    // Check if current auth token is an impersonation token
    const isImpersonation = (user as (typeof user & { isImpersonation?: boolean }) | null)?.isImpersonation;

    if (isImpersonation && user) {
      setImpersonationInfo({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantName: user.tenantName,
      });
      return;
    }

    // Also check sessionStorage (set by tenant impersonate flow)
    if (typeof window !== 'undefined') {
      const storedUser = sessionStorage.getItem('impersonation_user');
      const storedToken = sessionStorage.getItem('impersonation_token');
      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as ImpersonationInfo & { isImpersonation?: boolean };
          if (parsed.isImpersonation) {
            setImpersonationInfo({
              email: parsed.email,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              tenantName: parsed.tenantName,
            });
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [user, accessToken]);

  const handleExitImpersonation = () => {
    // Clear any session-stored impersonation data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('impersonation_token');
      sessionStorage.removeItem('impersonation_user');
    }
    // Log out and redirect back to super-admin
    logout();
    router.push('/login?redirect=/super-admin');
  };

  if (!impersonationInfo) {
    return null;
  }

  return (
    <div
      className="w-full bg-orange-500 text-white px-4 py-2 flex items-center justify-between gap-3 z-50 sticky top-0"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium truncate">
          You are impersonating{' '}
          <strong>
            {impersonationInfo.firstName} {impersonationInfo.lastName} ({impersonationInfo.email})
          </strong>
          {impersonationInfo.tenantName && (
            <> on behalf of <strong>{impersonationInfo.tenantName}</strong></>
          )}
        </span>
      </div>

      <button
        onClick={handleExitImpersonation}
        className="flex items-center gap-1.5 shrink-0 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap"
        aria-label="Exit impersonation session"
      >
        <X className="h-3.5 w-3.5" />
        Exit Impersonation
      </button>
    </div>
  );
}
