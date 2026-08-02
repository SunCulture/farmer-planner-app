import { api } from "@/services/api"
import type { GeneratePlanBody, PatchPlanBody } from "@/services/api/planner-types"

import {
  mapActivityCard,
  mapActivitySuggestion,
  mapDayPlan,
  mapPlanChatResult,
} from "./api-mappers"
import type { ActivityCard } from "../domain/entities/activity-card"
import type { ActivitySuggestion } from "../domain/entities/activity-suggestion"
import type { DayPlan } from "../domain/entities/day-plan"
import type { PlanChatResult } from "../domain/entities/plan-chat"

export async function fetchDayPlan(date: string): Promise<DayPlan> {
  const dto = await api.getDayPlan(date)
  return mapDayPlan(dto)
}

export async function generatePlan(body: GeneratePlanBody): Promise<string> {
  const dto = await api.generatePlan(body)
  return dto.planId
}

export async function enrollPlan(templateId: string, startDate?: string): Promise<string> {
  const dto = await api.enrollPlan({ templateId, startDate })
  return dto.planId
}

export async function sendPlanChat(planId: string, message: string): Promise<PlanChatResult> {
  const dto = await api.chatPlan(planId, message)
  return mapPlanChatResult(dto)
}

export async function patchPlanActivities(planId: string, body: PatchPlanBody): Promise<void> {
  await api.patchPlan(planId, body)
}

// ---- Activity suggestions (AI re-queue) ------------------------------------

export async function fetchActivitySuggestions(date: string): Promise<ActivitySuggestion[]> {
  const dtos = await api.listActivitySuggestions(date)
  return dtos.map(mapActivitySuggestion)
}

export interface AcceptSuggestionResult {
  activity: ActivityCard
  planId: string
  date: string
}

export async function acceptActivitySuggestion(id: string): Promise<AcceptSuggestionResult> {
  const dto = await api.acceptActivitySuggestion(id)
  return { activity: mapActivityCard(dto), planId: dto.planId, date: dto.date }
}

export async function dismissActivitySuggestion(id: string): Promise<void> {
  await api.dismissActivitySuggestion(id)
}
