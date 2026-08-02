import { useQuery } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { fetchActivityDetail } from "../infrastructure/plan-api"

export function useActivityDetail(activityId: string) {
  return useQuery({
    queryKey: plannerKeys.activity(activityId),
    queryFn: () => fetchActivityDetail(activityId),
    enabled: Boolean(activityId),
  })
}
