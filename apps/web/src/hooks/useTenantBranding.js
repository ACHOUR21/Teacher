'use client';
import { useState, useEffect } from 'react';

import { apiGet } from '@/lib/api';
const DEFAULT_BRANDING = {
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
export function useTenantBranding() {
    const [branding, setBranding] = useState(DEFAULT_BRANDING);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fetchTick, setFetchTick] = useState(0);
    useEffect(() => {
        let cancelled = false;
        const fetchBranding = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await apiGet('/white-label/branding');
                if (!cancelled) {
                    setBranding(data);
                }
            }
            catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch branding'));
                    // Keep showing defaults on error
                    setBranding(DEFAULT_BRANDING);
                }
            }
            finally {
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
