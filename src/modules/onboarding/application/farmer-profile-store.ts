import { save, load, saveString, loadString, remove } from "@/utils/storage"
import type { FarmerProfile } from "../domain/entities/farmer-profile"

const PROFILE_KEY = "farmer.profile"
const ONBOARDING_KEY = "onboarding.complete"
const AUTH_TOKEN_KEY = "auth.accessToken"

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

export function saveAuthToken(token: string): void {
  saveString(AUTH_TOKEN_KEY, token)
}

export function loadAuthToken(): string | null {
  return loadString(AUTH_TOKEN_KEY)
}

export function clearAuthToken(): void {
  remove(AUTH_TOKEN_KEY)
}
