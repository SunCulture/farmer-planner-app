import { api } from "@/services/api"
import { getGeneralApiProblem } from "@/services/api/apiProblem"

import { isUuidLike } from "./activity-qa-service"
import type { ActivityDetail } from "../domain/entities/activity-detail"

type ActivityDetailProblemKind =
  | "cannot-connect"
  | "timeout"
  | "server"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "rejected"
  | "unknown"
  | "bad-data"

/** Loose presenter payload used by mapActivityDetail unit tests and legacy callers. */
export type ActivityDetailRaw = {
  id: string
  title: string
  subtitle?: string
  description?: string
  educationBrief?: string
  status?: { code: string; label: string; color: string }
  iconKey?: string
  highlight: { text: string; addedAt: string } | null
  planId?: string
  date?: string
  completion?: {
    id: string
    journalText?: string | null
    photoUrls?: string[]
    status: string
    verifiedAt?: string | null
  } | null
}

export class ActivityDetailError extends Error {
  kind: ActivityDetailProblemKind
  temporary: boolean

  constructor(kind: ActivityDetailProblemKind, message: string, temporary = false) {
    super(message)
    this.kind = kind
    this.temporary = temporary
  }
}

export function iconKeyToEmoji(_iconKey?: string | null): string {
  return ""
}

function mapApiProblem(response: any): ActivityDetailError | null {
  const problem = getGeneralApiProblem(response)
  if (!problem) return null
  const temporary = "temporary" in problem ? !!problem.temporary : false
  return new ActivityDetailError(
    problem.kind,
    `Activity request failed: ${problem.kind}`,
    temporary,
  )
}

export function mapActivityDetail(raw: ActivityDetailRaw): ActivityDetail {
  const status = raw.status ?? { code: "PENDING", label: "Not started", color: "amber" }
  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description,
    educationBrief: raw.educationBrief,
    status,
    iconKey: raw.iconKey ?? "task",
    iconEmoji: iconKeyToEmoji(raw.iconKey),
    planId: raw.planId ?? "",
    date: raw.date ?? "",
    highlight:
      raw.highlight && typeof raw.highlight.text === "string"
        ? { text: raw.highlight.text, addedAt: String(raw.highlight.addedAt ?? "") }
        : null,
    completion: raw.completion
      ? {
          id: raw.completion.id,
          journalText: raw.completion.journalText ?? "",
          photoUrls: Array.isArray(raw.completion.photoUrls) ? raw.completion.photoUrls : [],
          status:
            raw.completion.status === "VERIFIED" || raw.completion.status === "REJECTED"
              ? raw.completion.status
              : "PENDING",
          verifiedAt: raw.completion.verifiedAt ?? null,
        }
      : null,
  }
}

export async function markActivityDone(activityId: string) {
  if (!isUuidLike(activityId)) {
    throw new ActivityDetailError("bad-data", "Cannot mark a local fallback activity as done")
  }
  const response = await api.markActivityDone(activityId)
  const problem = mapApiProblem(response)
  if (problem) throw problem
  return response.data?.data
}

export async function skipActivity(activityId: string, note?: string) {
  if (!isUuidLike(activityId)) {
    throw new ActivityDetailError("bad-data", "Cannot skip a local fallback activity")
  }
  const response = await api.skipActivity(activityId, note)
  const problem = mapApiProblem(response)
  if (problem) throw problem
  return response.data?.data
}

export async function contestActivity(
  activityId: string,
  reaction: "too_hard" | "too_easy" | "not_relevant" | "loved_it",
  note: string,
) {
  if (!isUuidLike(activityId)) {
    throw new ActivityDetailError("bad-data", "Cannot contest a local fallback activity")
  }
  const response = await api.contestActivity(activityId, { reaction, note })
  const problem = mapApiProblem(response)
  if (problem) throw problem
  return response.data?.data
}

export function getActivityErrorMessage(error: unknown): string {
  if (error instanceof ActivityDetailError) {
    if (error.kind === "not-found") return "Activity not found"
    if (error.kind === "cannot-connect" || error.kind === "timeout") {
      return "Could not reach the server. Check your connection and try again."
    }
    if (error.kind === "unauthorized") return "Please sign in again"
    return error.message
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

export function isActivityNotFoundError(error: unknown): boolean {
  return error instanceof ActivityDetailError && error.kind === "not-found"
}
