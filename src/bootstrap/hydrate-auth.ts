import { loadAuthToken } from "@/modules/onboarding"
import { api } from "@/services/api"

/**
 * Re-apply the persisted access token to the API client.
 * Must run on every JS boot (including Fast Refresh full reloads) before
 * authenticated queries fire — Expo Router often restores tabs without
 * remounting `app/index.tsx`, which used to be the only hydration path.
 */
export function hydrateAuthSession(): void {
  const token = loadAuthToken()
  if (token) {
    api.setAuthToken(token)
  }
}
