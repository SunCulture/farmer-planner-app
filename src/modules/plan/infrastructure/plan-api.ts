import { api } from "@/services/api"
import type { GeneratePlanBody, PatchPlanBody } from "@/services/api/planner-types"

import type { DayPlan } from "../domain/entities/day-plan"
import type { PlanChatResult } from "../domain/entities/plan-chat"
import { mapDayPlan, mapPlanChatResult } from "./api-mappers"

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
