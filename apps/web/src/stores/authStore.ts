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
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
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
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
