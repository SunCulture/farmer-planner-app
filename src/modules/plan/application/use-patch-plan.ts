import { useMutation, useQueryClient } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"
import type { PatchPlanBody } from "@/services/api/planner-types"

import { patchPlanActivities } from "../infrastructure/plan-api"

export function usePatchPlan(planId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: PatchPlanBody) => {
      if (!planId) throw new Error("No active plan")
      return patchPlanActivities(planId, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}
