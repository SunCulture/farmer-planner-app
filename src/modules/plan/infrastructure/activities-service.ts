// Activities API service
//
// API_LIVE = true  → simulates a real HTTP call (800ms latency, rare failures)
// API_LIVE = false → API is considered down; loads from the local mock calendar
//
// Flip API_LIVE to true when the real backend endpoint is wired in.

import type { PlanActivity } from "../domain/entities/activity"
import { buildActivitiesForDate } from "./activities-calendar"
import { api } from "@/services/api"
import { getGeneralApiProblem } from "@/services/api/apiProblem"

export const API_LIVE = true

const API_LATENCY_MS = 800
const FALLBACK_LATENCY_MS = 150

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchFromApi(dateStr: string): Promise<PlanActivity[]> {
  await sleep(API_LATENCY_MS)
  const response = await api.getDayPlan(dateStr)
  const problem = getGeneralApiProblem(response)
  if (problem) {
    throw new Error(`[activities-service] ${problem.kind} while fetching ${dateStr}`)
  }

  const rows = response.data?.data?.activities ?? response.data?.activities
  if (!Array.isArray(rows)) {
    throw new Error(`[activities-service] Invalid day plan shape for ${dateStr}`)
  }

  return rows.map((row: any, index: number) => ({
    id: typeof row?.id === "string" ? row.id : `${dateStr}-${index}`,
    name:
      typeof row?.title === "string"
        ? row.title
        : typeof row?.name === "string"
          ? row.name
          : `Activity ${index + 1}`,
    title: typeof row?.title === "string" ? row.title : undefined,
    subtitle: typeof row?.subtitle === "string" ? row.subtitle : undefined,
    description: typeof row?.description === "string" ? row.description : undefined,
    icon: typeof row?.iconKey === "string" ? "🌾" : "🧩",
    iconKey: typeof row?.iconKey === "string" ? row.iconKey : undefined,
    priority: "Medium",
    durationMinutes: 20,
    done: false,
    highlight:
      row?.highlight && typeof row.highlight.text === "string"
        ? { text: row.highlight.text, addedAt: String(row.highlight.addedAt ?? "") }
        : null,
  }))
}

export async function getActivitiesForDay(dateStr: string): Promise<PlanActivity[]> {
  if (!API_LIVE) {
    // API is down — read directly from local mock calendar
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
