import { useQuery } from "@tanstack/react-query"

import { api } from "@/services/api"

const CROP_EMOJI: Record<string, string> = {
  maize: "🌽",
  beans: "🫘",
  tomatoes: "🍅",
  kale: "🥬",
  potatoes: "🥔",
  onions: "🧅",
  coffee: "☕",
  tea: "🍵",
}

const LIVESTOCK_EMOJI: Record<string, string> = {
  cattle: "🐄",
  chickens: "🐔",
  goats: "🐐",
  sheep: "🐑",
  pigs: "🐷",
}

const GOAL_EMOJI: Record<string, string> = {
  MAKE_MONEY: "💰",
  FOOD_SECURITY: "🌽",
  SAVE_TIME: "⏰",
  REDUCE_LOSSES: "📉",
  LIVESTOCK_HEALTH: "🐄",
  MODERN_FARMING: "📚",
}

export function useOnboardingCatalog() {
  const cropsQuery = useQuery({
    queryKey: ["catalog", "crops"],
    queryFn: async () => {
      const response = await api.searchCrops()
      if (!response.ok || !response.data?.crops) return []
      return response.data.crops.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        emoji: CROP_EMOJI[c.slug] ?? "🌱",
      }))
    },
  })

  const livestockQuery = useQuery({
    queryKey: ["catalog", "livestock"],
    queryFn: async () => {
      const response = await api.searchLivestock()
      if (!response.ok || !response.data?.livestock) return []
      return response.data.livestock.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        emoji: LIVESTOCK_EMOJI[l.slug] ?? "🐄",
      }))
    },
  })

  const goalsQuery = useQuery({
    queryKey: ["catalog", "goals"],
    queryFn: async () => {
      const response = await api.listGoals()
      if (!response.ok || !response.data?.goals) return []
      return response.data.goals.map((g) => ({
        id: g.slug,
        name: g.name,
        slug: g.slug,
        emoji: GOAL_EMOJI[g.slug] ?? "🎯",
      }))
    },
  })

  return {
    crops: cropsQuery.data ?? [],
    livestock: livestockQuery.data ?? [],
    goals: goalsQuery.data ?? [],
    isLoading: cropsQuery.isLoading || livestockQuery.isLoading || goalsQuery.isLoading,
  }
}
