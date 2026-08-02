import { useMutation, useQueryClient } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import type { ActivitySuggestion } from "../domain/entities/activity-suggestion"
import { dismissActivitySuggestion } from "../infrastructure/plan-api"

export interface DismissSuggestionInput {
  id: string
  date: string
}

/** Dismisses a suggestion and removes its card from the sheet immediately. */
export function useDismissSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DismissSuggestionInput) => dismissActivitySuggestion(input.id),
    onSuccess: (_void, { id, date }) => {
      queryClient.setQueryData<ActivitySuggestion[] | undefined>(
        plannerKeys.suggestions(date),
        (old) => old?.filter((s) => s.id !== id),
      )
    },
  })
}
