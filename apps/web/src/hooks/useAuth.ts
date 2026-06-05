'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { apiPost } from '@/lib/api';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  tenantId?: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
  tenantId: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'SCHOOL_ADMIN' | 'UNIVERSITY_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    avatar?: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    isEmailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  requiresMfa?: boolean;
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading, login, logout, updateUser, setLoading } =
    useAuthStore();

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const { tenantId, ...body } = credentials;
        const headers = tenantId ? { 'x-tenant-id': tenantId } : undefined;
        const data = await apiPost<AuthResponse>('/auth/login', body, { headers });
        if (data.requiresMfa) {
          return { requiresMfa: true };
        }
        login(data.user, data.tokens.accessToken);
        router.push('/');
        return { success: true };
      } finally {
        setLoading(false);
      }
    },
    [login, router, setLoading]
  );

  const signUp = useCallback(
    async (data: RegisterData) => {
      setLoading(true);
      try {
        const { tenantId, ...body } = data;
        await apiPost('/auth/register', body, { headers: { 'x-tenant-id': tenantId } });
        router.push('/login?registered=true');
        return { success: true };
      } finally {
        setLoading(false);
      }
    },
    [router, setLoading]
  );

  const signOut = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // Ignore logout errors — clear locally regardless
    } finally {
      logout();
      router.push('/login');
    }
  }, [logout, router]);

  const forgotPassword = useCallback(async (email: string, tenantId?: string) => {
    const headers = tenantId ? { 'x-tenant-id': tenantId } : undefined;
    return apiPost('/auth/forgot-password', { email }, { headers });
  }, []);

  const verifyMfa = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const data = await apiPost<AuthResponse>('/auth/mfa/verify', { code });
        login(data.user, data.tokens.accessToken);
        router.push('/');
        return { success: true };
      } finally {
        setLoading(false);
      }
    },
    [login, router, setLoading]
  );

  const refreshToken = useCallback(async (): Promise<string> => {
    const data = await apiPost<{ accessToken: string }>('/auth/refresh');
    updateUser({});
    return data.accessToken;
  }, [updateUser]);

  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user) return false;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'UNIVERSITY_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    verifyMfa,
    refreshToken,
    hasRole,
    updateUser,
  };
}
