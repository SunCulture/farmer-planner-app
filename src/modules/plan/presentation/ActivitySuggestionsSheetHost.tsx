import { ActivitySuggestionsSheet } from "./ActivitySuggestionsSheet"
import { useSuggestionQueueListener } from "../application/use-suggestion-queue-listener"

/**
 * App-wide singleton: connects the SSE queue listener and renders the one
 * bottom-sheet instance both the SSE event and the persistent banner drive.
 * Mount exactly once (see `src/app/(tabs)/_layout.tsx`) — mounting it more
 * than once would open duplicate SSE subscriptions.
 */
export function ActivitySuggestionsSheetHost() {
  useSuggestionQueueListener()
  return <ActivitySuggestionsSheet />
}

export default ActivitySuggestionsSheetHost
