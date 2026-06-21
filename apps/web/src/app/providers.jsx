'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import React, { useEffect } from 'react';

import { Toaster } from '@/components/ui/Toaster';
import { I18nProvider } from '@/i18n/provider';
import { initApiInterceptors } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
function ApiInterceptorInit() {
    const { accessToken: _accessToken, logout: _logout } = useAuthStore();
    useEffect(() => {
        initApiInterceptors(() => useAuthStore.getState().accessToken, () => useAuthStore.getState().logout(), async () => {
            const storedRefreshToken = useAuthStore.getState().refreshToken;
            if (!storedRefreshToken)
                {throw new Error('No refresh token available');}
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });
            if (!res.ok) {
                throw new Error('Refresh failed');
            }
            const data = await res.json();
            useAuthStore.getState().setAccessToken(data.accessToken);
            return data.accessToken;
        }, () => useAuthStore.getState().user?.tenantId ?? null);
    }, []);
    return null;
}
export function Providers({ children }) {
    return (<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <ApiInterceptorInit />
          {children}
          <Toaster />
          {process.env.NODE_ENV === 'development' && (<ReactQueryDevtools initialIsOpen={false}/>)}
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>);
}
