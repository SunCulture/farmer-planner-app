import { useQuery } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { fetchDayPlan } from "../infrastructure/plan-api"

export function useDayPlan(date: string) {
  return useQuery({
    queryKey: plannerKeys.dayPlan(date),
    queryFn: () => fetchDayPlan(date),
    enabled: Boolean(date),
  })
}
