'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { initApiInterceptors } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Toaster } from '@/components/ui/Toaster';

function ApiInterceptorInit() {
  const { accessToken, logout } = useAuthStore();

  useEffect(() => {
    initApiInterceptors(
      () => useAuthStore.getState().accessToken,
      () => useAuthStore.getState().logout(),
      async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`,
          { method: 'POST', credentials: 'include' }
        );
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiInterceptorInit />
      {children}
      <Toaster />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
