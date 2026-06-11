import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OnboardingState {
  step: number;
  orgName: string;
  orgType: string;
  country: string;
  timezone: string;
  logoUrl: string | null;
  primaryColor: string;
  tagline: string;
  inviteEmails: string[];
  firstCourseTitle: string;
  firstCourseDescription: string;
}

interface OnboardingActions {
  setStep: (step: number) => void;
  updateOrg: (data: Partial<OnboardingState>) => void;
  reset: () => void;
}

const defaultState: OnboardingState = {
  step: 1,
  orgName: '',
  orgType: '',
  country: '',
  timezone: '',
  logoUrl: null,
  primaryColor: '#3B82F6',
  tagline: '',
  inviteEmails: [],
  firstCourseTitle: '',
  firstCourseDescription: '',
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set) => ({
      ...defaultState,

      setStep: (step) => set({ step }),

      updateOrg: (data) =>
        set((state) => ({ ...state, ...data })),

      reset: () => set({ ...defaultState }),
    }),
    {
      name: 'onboarding',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as Storage)
      ),
    }
  )
);
