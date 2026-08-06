import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { router } from "expo-router"

import { container } from "@/bootstrap/container"
import { clearAuthToken } from "@/modules/onboarding"
import { api } from "@/services/api"
import { onSessionExpired } from "@/services/api/session-expired"
import type { SseClient } from "@/shared/contracts/sse"

/**
 * When the API refresh path fails (invalid/expired tokens), leave authenticated
 * screens immediately instead of leaving tabs stuck on loading spinners.
 */
export function SessionExpiredListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return onSessionExpired(() => {
      clearAuthToken()
      api.clearAuthToken()
      try {
        container.resolve<SseClient>("sseClient")?.disconnect()
      } catch {
        // sse client may not be registered yet during early boot
      }
      queryClient.clear()
      router.replace("/onboarding" as any)
    })
  }, [queryClient])

  return null
}
