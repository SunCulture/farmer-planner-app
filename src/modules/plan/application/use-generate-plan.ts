import { useMutation, useQueryClient } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"
import type { GeneratePlanBody } from "@/services/api/planner-types"

import { generatePlan } from "../infrastructure/plan-api"

export function useGeneratePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: GeneratePlanBody) => generatePlan(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}
