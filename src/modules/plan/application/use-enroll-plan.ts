import { useMutation, useQueryClient } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { enrollPlan } from "../infrastructure/plan-api"

export function useEnrollPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, startDate }: { templateId: string; startDate?: string }) =>
      enrollPlan(templateId, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}
