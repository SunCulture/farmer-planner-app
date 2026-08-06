import { useMutation } from "@tanstack/react-query"

import { completeOnboardingProfile, patchOnboardingProfile } from "../infrastructure/onboarding-api"

/**
 * Persists the in-progress onboarding draft via `PATCH /me/onboarding`.
 * Used for every step, including the free-text 2-week goal.
 */
export function usePatchOnboarding() {
  return useMutation({
    mutationFn: patchOnboardingProfile,
  })
}

/**
 * Finalises onboarding via `POST /me/onboarding/complete`. Callers are
 * responsible for gating this behind client-side validation (e.g. the
 * 2-week goal minimum length) since the UI should never let a farmer reach
 * this call with incomplete required fields.
 */
export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: completeOnboardingProfile,
  })
}
