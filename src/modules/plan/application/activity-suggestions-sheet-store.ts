/**
 * Tiny external store coordinating the (single, app-wide) activity
 * suggestions bottom sheet: the SSE listener and the "unreviewed
 * suggestions" banner both need to open the same sheet instance, and the
 * sheet itself is mounted once (see `ActivitySuggestionsSheetHost`). Kept
 * dependency-free (no React import) so it's usable from both application
 * hooks and plain unit tests.
 */
export interface ActivitySuggestionsSheetState {
  isOpen: boolean
  date: string | null
}

type Listener = () => void

let state: ActivitySuggestionsSheetState = { isOpen: false, date: null }
const listeners = new Set<Listener>()

function emit(): void {
  listeners.forEach((listener) => listener())
}

export function openActivitySuggestionsSheet(date: string): void {
  state = { isOpen: true, date }
  emit()
}

export function closeActivitySuggestionsSheet(): void {
  if (!state.isOpen) return
  state = { ...state, isOpen: false }
  emit()
}

export function getActivitySuggestionsSheetState(): ActivitySuggestionsSheetState {
  return state
}

export function subscribeActivitySuggestionsSheet(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Test-only: resets the module-level singleton between test cases. */
export function __resetActivitySuggestionsSheetStoreForTests(): void {
  state = { isOpen: false, date: null }
  listeners.clear()
}
