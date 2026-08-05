import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { planKeys } from "@/shared/query-keys"

import { fetchActivityDetail } from "../infrastructure/activity-detail-service"
import { subscribeActivitySSE } from "../infrastructure/activity-qa-sse"

export function useActivityDetail(activityId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!activityId) return
    return subscribeActivitySSE("activity_refined", (payload) => {
      const data = payload as { activityId?: string }
      if (data?.activityId !== activityId) return
      queryClient.invalidateQueries({ queryKey: planKeys.activity(activityId) })
      queryClient.invalidateQueries({ queryKey: planKeys.all })
    })
  }, [activityId, queryClient])

  return useQuery({
    queryKey: planKeys.activity(activityId),
    queryFn: () => fetchActivityDetail(activityId),
    enabled: Boolean(activityId),
  })
}
