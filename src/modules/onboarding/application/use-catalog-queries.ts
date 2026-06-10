import { useQuery } from "@tanstack/react-query"

import { api } from "@/services/api"

export function useCrops() {
  return useQuery({
    queryKey: ["catalog", "crops"],
    queryFn: async () => {
      const res = await api.searchCrops()
      return res.data?.crops ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useLivestock() {
  return useQuery({
    queryKey: ["catalog", "livestock"],
    queryFn: async () => {
      const res = await api.searchLivestock()
      return res.data?.livestock ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useRegions() {
  return useQuery({
    queryKey: ["catalog", "regions"],
    queryFn: async () => {
      const res = await api.listRegions(true)
      return res.data?.regions ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoals() {
  return useQuery({
    queryKey: ["catalog", "goals"],
    queryFn: async () => {
      const res = await api.listGoals()
      return res.data?.goals ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}
