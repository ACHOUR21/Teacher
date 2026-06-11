/**
 * Onboarding guard utility.
 *
 * Returns true if the given user object indicates that onboarding has not been
 * completed, so the caller can redirect them to the onboarding wizard.
 */

export interface OnboardingUser {
  onboardingCompleted?: boolean;
  [key: string]: unknown;
}

export function shouldRedirectToOnboarding(user: OnboardingUser): boolean {
  return user.onboardingCompleted === false;
}
