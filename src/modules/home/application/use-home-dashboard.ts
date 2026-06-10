import { useQuery } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import { fetchHomeDashboard } from "../infrastructure/home-api"

export function useHomeDashboard() {
  return useQuery({
    queryKey: plannerKeys.home(),
    queryFn: fetchHomeDashboard,
  })
}
