/**
 * Resolves the API base URL from EXPO_PUBLIC_API_URL.
 *
 * This env var is the single source of truth:
 * - Local: set in `.env` (see `.env.example`)
 * - EAS builds: set per environment (development / preview / production)
 *
 * Change it once in EAS (or `.env` locally) — do not hardcode URLs here.
 */
export function resolveApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim()

  if (!raw) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. " +
        "Add it to `.env` for local runs, or to the EAS environment for this build profile " +
        "(development / preview / production).",
    )
  }

  return raw.replace(/\/$/, "")
}
