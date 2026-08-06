import { useQueries } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { addDaysToDateStr, todayDateStr } from "../domain/policies/date-utils"
import { pickBannerDate } from "../domain/policies/unreviewed-suggestions"
import { fetchActivitySuggestions } from "../infrastructure/plan-api"

/**
 * Drives the persistent "You have AI suggestions" banner: checks pending
 * suggestions for today and tomorrow via `GET /me/activity-suggestions`
 * directly (rather than relying on the SSE event), so the banner still
 * appears if the event was missed (e.g. app was backgrounded).
 */
export function useUnreviewedSuggestions() {
  const today = todayDateStr()
  const tomorrow = addDaysToDateStr(today, 1)

  const [todayQuery, tomorrowQuery] = useQueries({
    queries: [
      {
        queryKey: plannerKeys.suggestions(today),
        queryFn: () => fetchActivitySuggestions(today),
      },
      {
        queryKey: plannerKeys.suggestions(tomorrow),
        queryFn: () => fetchActivitySuggestions(tomorrow),
      },
    ],
  })

  const todayCount = todayQuery.data?.length ?? 0
  const tomorrowCount = tomorrowQuery.data?.length ?? 0
  const date = pickBannerDate(today, tomorrow, todayCount, tomorrowCount)

  return {
    visible: date !== null,
    date,
    isLoading: todayQuery.isLoading || tomorrowQuery.isLoading,
  }
}
