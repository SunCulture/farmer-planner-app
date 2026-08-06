import Config from "@/config"
import { api } from "@/services/api"

/**
 * Hydrates the API client with a dev access token from EXPO_PUBLIC_DEV_ACCESS_TOKEN.
 * Returns true when a token was applied.
 */
export function initDevAuth(): boolean {
  const token = Config.DEV_ACCESS_TOKEN?.trim()
  if (token) {
    api.setAuthToken(token)
    if (__DEV__) {
      console.debug("DEV-AUTH: access token applied from EXPO_PUBLIC_DEV_ACCESS_TOKEN")
    }
    return true
  }

  if (__DEV__) {
    console.warn(
      "DEV-AUTH: EXPO_PUBLIC_DEV_ACCESS_TOKEN is not set — authenticated API calls will return 401. " +
        "Register via Postman and paste the accessToken into .env.",
    )
  }
  return false
}

export function hasDevAuthToken(): boolean {
  return Boolean(Config.DEV_ACCESS_TOKEN?.trim())
}
