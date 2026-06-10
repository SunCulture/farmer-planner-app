import { api } from "@/services/api"
import { unwrap } from "@/services/api/unwrap"
import type { OnboardingData } from "@/services/api"

import type { FarmerProfile } from "../domain/entities/farmer-profile"

export async function patchOnboardingProfile(profile: FarmerProfile): Promise<OnboardingData> {
  const response = await api.patchOnboarding(profile)
  return unwrap(response)
}

export async function completeOnboardingProfile(): Promise<
  Pick<OnboardingData, "farmerId" | "onboardingCompletedAt" | "suggestedStep" | "steps">
> {
  const response = await api.completeOnboarding()
  return unwrap(response)
}
