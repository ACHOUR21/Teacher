/**
 * Onboarding guard utility.
 *
 * Returns true if the given user object indicates that onboarding has not been
 * completed, so the caller can redirect them to the onboarding wizard.
 */
export function shouldRedirectToOnboarding(user) {
    return user.onboardingCompleted === false;
}
