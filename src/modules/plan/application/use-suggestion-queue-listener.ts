import { useEffect } from "react"

import { container } from "@/bootstrap/container"
import { loadAuthToken } from "@/modules/onboarding"
import type { SseClient } from "@/shared/contracts/sse"

import { openActivitySuggestionsSheet } from "./activity-suggestions-sheet-store"

export interface ActivityQueueUpdatedPayload {
  date: string
  suggestions: { id: string; title: string }[]
}

/**
 * Connects the shared SSE client (resolved via `container`, never imported
 * directly — see src/shared/contracts/sse.ts) and opens the activity
 * suggestions sheet whenever the backend pushes `activity_queue_updated`.
 * Mount exactly once, in `ActivitySuggestionsSheetHost`.
 */
export function useSuggestionQueueListener(): void {
  useEffect(() => {
    const sse = container.resolve<SseClient>("sseClient")
    const token = loadAuthToken()
    if (!sse || !token) return

    sse.connect(token)

    const unsubscribe = sse.on<ActivityQueueUpdatedPayload>("activity_queue_updated", (data) => {
      if (data?.date) {
        openActivitySuggestionsSheet(data.date)
      }
    })

    return unsubscribe
  }, [])
}
