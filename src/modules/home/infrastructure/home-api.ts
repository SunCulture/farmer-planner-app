import { api } from "@/services/api"

import type { HomeDashboard, PlanRecommendation } from "../domain/entities/home-dashboard"
import { mapHomeDashboard } from "@/modules/plan/infrastructure/api-mappers"

export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  const dto = await api.getHome()
  return mapHomeDashboard(dto)
}

export async function fetchPlanRecommendations(): Promise<PlanRecommendation[]> {
  const dto = await api.getPlanRecommendations()
  return dto.recommendations
}
