'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { apiPost } from '@/lib/api';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'teacher' | 'student' | 'parent';
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'tenant_admin' | 'teacher' | 'student' | 'parent';
    avatar?: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    isEmailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: string;
  };
  accessToken: string;
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
        const data = await apiPost<AuthResponse>('/auth/login', credentials);
        if (data.requiresMfa) {
          return { requiresMfa: true };
        }
        login(data.user, data.accessToken);
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
        await apiPost('/auth/register', data);
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

  const forgotPassword = useCallback(async (email: string) => {
    return apiPost('/auth/forgot-password', { email });
  }, []);

  const verifyMfa = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const data = await apiPost<AuthResponse>('/auth/mfa/verify', { code });
        login(data.user, data.accessToken);
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

  const isAdmin = user?.role === 'super_admin' || user?.role === 'tenant_admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';

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
