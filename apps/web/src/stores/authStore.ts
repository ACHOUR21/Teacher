import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SCHOOL_ADMIN'
  | 'UNIVERSITY_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  mfaChallengeToken: string | null;
}

interface AuthActions {
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (v: boolean) => void;
  setMfaChallengeToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
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
    }),
    {
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
    }
  )
);
