import { useQuery } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { fetchPlanRecommendations } from "../infrastructure/home-api"

export function usePlanRecommendations() {
  return useQuery({
    queryKey: plannerKeys.recommendations(),
    queryFn: fetchPlanRecommendations,
  })
}
