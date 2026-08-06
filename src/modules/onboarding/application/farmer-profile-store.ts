import { save, load, saveString, loadString, remove } from "@/utils/storage"
import type { FarmerProfile } from "../domain/entities/farmer-profile"

const PROFILE_KEY = "farmer.profile"
const ONBOARDING_KEY = "onboarding.complete"
const AUTH_TOKEN_KEY = "auth.accessToken"
const AUTH_REFRESH_TOKEN_KEY = "auth.refreshToken"

export function saveFarmerProfile(profile: FarmerProfile): void {
  save(PROFILE_KEY, profile)
}

export function setOnboardingComplete(complete: boolean): void {
  if (complete) {
    saveString(ONBOARDING_KEY, "1")
    return
  }
  remove(ONBOARDING_KEY)
}

export function loadFarmerProfile(): FarmerProfile | null {
  return load<FarmerProfile>(PROFILE_KEY)
}

export function isOnboardingComplete(): boolean {
  return loadString(ONBOARDING_KEY) === "1"
}

export function markOnboardingComplete(): void {
  saveString(ONBOARDING_KEY, "1")
}

/** Persist both tokens from login/register/refresh. */
export function saveAuthSession(accessToken: string, refreshToken?: string): void {
  saveString(AUTH_TOKEN_KEY, accessToken)
  if (refreshToken) {
    saveString(AUTH_REFRESH_TOKEN_KEY, refreshToken)
  }
}

/** @deprecated Prefer saveAuthSession — kept for call sites that only have an access token. */
export function saveAuthToken(token: string): void {
  saveString(AUTH_TOKEN_KEY, token)
}

export function loadAuthToken(): string | null {
  return loadString(AUTH_TOKEN_KEY)
}

export function loadRefreshToken(): string | null {
  return loadString(AUTH_REFRESH_TOKEN_KEY)
}

export function clearAuthToken(): void {
  remove(AUTH_TOKEN_KEY)
  remove(AUTH_REFRESH_TOKEN_KEY)
}
