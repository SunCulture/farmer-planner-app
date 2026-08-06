import { AppState } from "react-native"
import { focusManager, QueryClient } from "@tanstack/react-query"

// Tell TanStack Query to treat React Native's AppState "active" event as a
// focus event. Without this, refetchOnWindowFocus never fires in React Native
// because there is no browser visibilitychange / focus event.
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener("change", (state) => {
    handleFocus(state === "active")
  })
  return () => sub.remove()
})

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 0 means data is immediately stale — any focus or invalidation will
        // trigger a background refetch while showing cached data instantly.
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
    },
  })
}
