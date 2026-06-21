import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    _hasHydrated: false,
    mfaChallengeToken: null,
    setHasHydrated: (v) => set({ _hasHydrated: v }),
    setMfaChallengeToken: (token) => set({ mfaChallengeToken: token }),
    login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false, mfaChallengeToken: null });
    },
    logout: () => {
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            mfaChallengeToken: null,
        });
    },
    updateUser: (updates) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
        }));
    },
    setAccessToken: (token) => {
        set({ accessToken: token });
    },
    setLoading: (isLoading) => {
        set({ isLoading });
    },
}), {
    name: 'eduai-auth',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
    }),
    onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
    },
}));
