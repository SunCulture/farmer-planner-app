import { useMutation, useQueryClient } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import type { ActivityCard } from "../domain/entities/activity-card"
import type { ActivitySuggestion } from "../domain/entities/activity-suggestion"
import type { DayPlan } from "../domain/entities/day-plan"
import { acceptActivitySuggestion } from "../infrastructure/plan-api"

/** Suggestion cards keep showing a brief success state before disappearing. */
export const ACCEPT_SUCCESS_DISPLAY_MS = 700

/**
 * Accepts a suggestion: the response carries the newly-created activity plus
 * the plan/date it landed on, so we merge it straight into that day's
 * `dayPlan` query cache instead of refetching. The suggestion itself is
 * removed from the `suggestions` cache after a short delay so the UI can
 * show a success animation first.
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => acceptActivitySuggestion(id),
    onSuccess: (result, id) => {
      queryClient.setQueryData<DayPlan | undefined>(plannerKeys.dayPlan(result.date), (old) =>
        old ? { ...old, activities: [...old.activities, result.activity as ActivityCard] } : old,
      )

      setTimeout(() => {
        queryClient.setQueryData<ActivitySuggestion[] | undefined>(
          plannerKeys.suggestions(result.date),
          (old) => old?.filter((s) => s.id !== id),
        )
      }, ACCEPT_SUCCESS_DISPLAY_MS)
    },
  })
}
