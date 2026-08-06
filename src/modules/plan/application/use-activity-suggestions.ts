import { useQuery } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { fetchActivitySuggestions } from "../infrastructure/plan-api"

/**
 * Loads pending activity suggestions for a given date. Used both by the
 * bottom sheet (so it renders correctly whether opened via the SSE event or
 * the persistent banner) and by `useUnreviewedSuggestions` for the banner's
 * today/tomorrow check.
 */
export function useActivitySuggestions(date: string | null | undefined) {
  return useQuery({
    queryKey: plannerKeys.suggestions(date ?? ""),
    queryFn: () => fetchActivitySuggestions(date as string),
    enabled: Boolean(date),
  })
}
