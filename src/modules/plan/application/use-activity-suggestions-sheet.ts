import { useSyncExternalStore } from "react"

import {
  closeActivitySuggestionsSheet,
  getActivitySuggestionsSheetState,
  openActivitySuggestionsSheet,
  subscribeActivitySuggestionsSheet,
} from "./activity-suggestions-sheet-store"

/**
 * Reactive view over the app-wide activity-suggestions sheet state (see
 * `activity-suggestions-sheet-store.ts`). Any screen can call `open(date)`
 * (e.g. the persistent banner); the single mounted `ActivitySuggestionsSheet`
 * re-renders when state changes.
 */
export function useActivitySuggestionsSheet() {
  const state = useSyncExternalStore(
    subscribeActivitySuggestionsSheet,
    getActivitySuggestionsSheetState,
    getActivitySuggestionsSheetState,
  )

  return {
    isOpen: state.isOpen,
    date: state.date,
    open: openActivitySuggestionsSheet,
    close: closeActivitySuggestionsSheet,
  }
}
