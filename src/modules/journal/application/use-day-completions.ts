import { useQuery } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { fetchDayCompletions } from "../infrastructure/journal-api"

export function useDayCompletions(date: string) {
  return useQuery({
    queryKey: plannerKeys.dayCompletions(date),
    queryFn: () => fetchDayCompletions(date),
    enabled: Boolean(date),
  })
}
