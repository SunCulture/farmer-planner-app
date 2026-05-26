import { save, load, saveString, loadString } from "@/utils/storage"
import type { FarmerProfile } from "../domain/entities/farmer-profile"

const PROFILE_KEY = "farmer.profile"
const ONBOARDING_KEY = "onboarding.complete"

export function saveFarmerProfile(profile: FarmerProfile): void {
  save(PROFILE_KEY, profile)
  saveString(ONBOARDING_KEY, "1")
}

export function loadFarmerProfile(): FarmerProfile | null {
  return load<FarmerProfile>(PROFILE_KEY)
}

export function isOnboardingComplete(): boolean {
  return loadString(ONBOARDING_KEY) === "1"
}
