import { api } from "@/services/api"
import type { GeneratePlanBody, PatchPlanBody } from "@/services/api/planner-types"

import {
  mapActivityDetail,
  mapActivityQuestion,
  mapDayActivityQuestions,
  mapDayPlan,
  mapPlanChatResult,
} from "./api-mappers"
import type { ActivityDetail } from "../domain/entities/activity-detail"
import type { ActivityQuestion, DayActivityQuestions } from "../domain/entities/activity-question"
import type { DayPlan } from "../domain/entities/day-plan"
import type { PlanChatResult } from "../domain/entities/plan-chat"

export async function fetchDayPlan(date: string): Promise<DayPlan> {
  const dto = await api.getDayPlan(date)
  return mapDayPlan(dto)
}

export async function fetchActivityDetail(activityId: string): Promise<ActivityDetail> {
  const dto = await api.getActivity(activityId)
  return mapActivityDetail(dto)
}

export async function fetchActivityQuestions(activityId: string): Promise<ActivityQuestion[]> {
  const dto = await api.getActivityQuestions(activityId)
  return dto.questions.map(mapActivityQuestion)
}

export async function askActivityQuestion(
  activityId: string,
  question: string,
): Promise<{ questionId: string; question: string; status: "pending" }> {
  return api.askActivityQuestion(activityId, question)
}

export async function fetchDayActivityQuestions(date: string): Promise<DayActivityQuestions[]> {
  const dto = await api.getDayActivityQuestions(date)
  return mapDayActivityQuestions(dto)
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
