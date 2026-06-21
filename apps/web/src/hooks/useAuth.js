'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
export function useAuth() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading, mfaChallengeToken, login, logout, updateUser, setLoading, setMfaChallengeToken, } = useAuthStore();
    const signIn = useCallback(async (credentials) => {
        setLoading(true);
        try {
            const { tenantId, ...body } = credentials;
            const headers = tenantId ? { 'x-tenant-id': tenantId } : undefined;
            const resp = await apiPost('/auth/login', body, { headers });
            const data = resp?.data ?? resp;
            if (data.requiresMfa) {
                // Store the challenge token so the /2fa page can complete the flow
                setMfaChallengeToken(data.tokens.accessToken);
                return { requiresMfa: true };
            }
            login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
            router.push('/');
            return { success: true };
        }
        finally {
            setLoading(false);
        }
    }, [login, router, setLoading, setMfaChallengeToken]);
    const signUp = useCallback(async (data) => {
        setLoading(true);
        try {
            const { tenantId, ...body } = data;
            await apiPost('/auth/register', body, { headers: { 'x-tenant-id': tenantId } });
            router.push('/login?registered=true');
            return { success: true };
        }
        finally {
            setLoading(false);
        }
    }, [router, setLoading]);
    const signOut = useCallback(async () => {
        try {
            await apiPost('/auth/logout');
        }
        catch {
            // Ignore logout errors — clear locally regardless
        }
        finally {
            logout();
            router.push('/login');
        }
    }, [logout, router]);
    const forgotPassword = useCallback(async (email, tenantId) => {
        const headers = tenantId ? { 'x-tenant-id': tenantId } : undefined;
        return apiPost('/auth/forgot-password', { email }, { headers });
    }, []);
    const verifyMfa = useCallback(async (code, opts) => {
        setLoading(true);
        try {
            const challengeToken = useAuthStore.getState().mfaChallengeToken;
            const resp = await apiPost('/auth/mfa/challenge', {
                challengeToken,
                code,
                trustDevice: opts?.trustDevice,
                deviceId: opts?.deviceId,
                deviceName: opts?.deviceName,
            });
            const data = resp?.data ?? resp;
            login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
            router.push('/');
            return { success: true };
        }
        finally {
            setLoading(false);
        }
    }, [login, router, setLoading]);
    const refreshToken = useCallback(async () => {
        const storedRefreshToken = useAuthStore.getState().refreshToken;
        if (!storedRefreshToken)
            {throw new Error('No refresh token available');}
        const resp = await apiPost('/auth/refresh', { refreshToken: storedRefreshToken });
        const data = resp?.data ?? resp;
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
    }, []);
    const hasRole = useCallback((roles) => {
        if (!user) {
            return false;
        }
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        return allowedRoles.includes(user.role);
    }, [user]);
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
        mfaChallengeToken,
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
