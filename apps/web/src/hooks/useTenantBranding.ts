'use client';

import { useState, useEffect } from 'react';

import { apiGet } from '@/lib/api';

export interface TenantBranding {
  tenantId: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  tagline: string;
  customCss: string;
  customDomain: string | null;
}

const DEFAULT_BRANDING: TenantBranding = {
  tenantId: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4',
  fontFamily: 'Inter',
  tagline: '',
  customCss: '',
  customDomain: null,
};

interface UseTenantBrandingResult {
  branding: TenantBranding;
  isLoading: boolean;
  error: Error | null;
  /** Manually re-fetch branding (e.g. after an update) */
  refetch: () => void;
}

/**
 * useTenantBranding
 *
 * Fetches the current tenant's branding configuration from the API on mount.
 * Falls back to platform defaults while loading or on error.
 *
 * Endpoint: GET /white-label/branding
 *
 * Usage:
 *   const { branding, isLoading } = useTenantBranding();
 */
export function useTenantBranding(): UseTenantBrandingResult {
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTick, setFetchTick] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const fetchBranding = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiGet<TenantBranding>('/white-label/branding');
        if (!cancelled) {
          setBranding(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch branding'));
          // Keep showing defaults on error
          setBranding(DEFAULT_BRANDING);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchBranding();

    return () => {
      cancelled = true;
    };
  }, [fetchTick]);

  const refetch = () => setFetchTick((t) => t + 1);

  return { branding, isLoading, error, refetch };
}
