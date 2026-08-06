// Activities API service
//
// Prefer `useDayPlan` / `plan-api` for new UI. This helper remains for
// callers that still want a PlanActivity[] shape with local mock fallback.

import type { PlanActivity } from "../domain/entities/activity"
import { buildActivitiesForDate } from "./activities-calendar"
import { api } from "@/services/api"

export const API_LIVE = true

const API_LATENCY_MS = 800
const FALLBACK_LATENCY_MS = 150

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchFromApi(dateStr: string): Promise<PlanActivity[]> {
  await sleep(API_LATENCY_MS)
  const dayPlan = await api.getDayPlan(dateStr)
  const rows = dayPlan.activities
  if (!Array.isArray(rows)) {
    throw new Error(`[activities-service] Invalid day plan shape for ${dateStr}`)
  }

  return rows.map((row, index) => ({
    id: typeof row?.id === "string" ? row.id : `${dateStr}-${index}`,
    name: typeof row?.title === "string" ? row.title : `Activity ${index + 1}`,
    title: typeof row?.title === "string" ? row.title : undefined,
    subtitle: typeof row?.subtitle === "string" ? row.subtitle : undefined,
    description: typeof row?.description === "string" ? row.description : undefined,
    icon: "",
    iconKey: typeof row?.iconKey === "string" ? row.iconKey : undefined,
    priority: "Medium",
    durationMinutes: 20,
    done: row?.status?.code === "VERIFIED",
    highlight:
      row?.highlight && typeof row.highlight.text === "string"
        ? { text: row.highlight.text, addedAt: String(row.highlight.addedAt ?? "") }
        : null,
  }))
}

export async function getActivitiesForDay(dateStr: string): Promise<PlanActivity[]> {
  if (!API_LIVE) {
    await sleep(FALLBACK_LATENCY_MS)
    return buildActivitiesForDate(dateStr)
  }

  try {
    return await fetchFromApi(dateStr)
  } catch (err) {
    console.warn("[activities-service] API failed, using local fallback:", err)
    return buildActivitiesForDate(dateStr)
  }
}
