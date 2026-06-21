import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
const defaultState = {
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
export const useOnboardingStore = create()(persist((set) => ({
    ...defaultState,
    setStep: (step) => set({ step }),
    updateOrg: (data) => set((state) => ({ ...state, ...data })),
    reset: () => set({ ...defaultState }),
}), {
    name: 'onboarding',
    storage: createJSONStorage(() => typeof window !== 'undefined'
        ? localStorage
        : {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
            length: 0,
            clear: () => { },
            key: () => null,
        }),
}));
