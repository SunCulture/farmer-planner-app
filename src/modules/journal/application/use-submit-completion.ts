import { useMutation, useQueryClient } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { submitActivityCompletion, type SubmitCompletionInput } from "../infrastructure/journal-api"

export function useSubmitCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitCompletionInput) => submitActivityCompletion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}
