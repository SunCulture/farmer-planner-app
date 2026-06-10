import { useMutation } from "@tanstack/react-query"

import { sendPlanChat } from "../infrastructure/plan-api"

export function usePlanChat(planId: string | undefined) {
  return useMutation({
    mutationFn: (message: string) => {
      if (!planId) throw new Error("No active plan")
      return sendPlanChat(planId, message)
    },
  })
}
