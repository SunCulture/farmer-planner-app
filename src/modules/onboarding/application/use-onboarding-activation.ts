import { useCallback, useEffect, useRef, useState } from "react"

import { container } from "@/bootstrap/container"
import type { SseClient } from "@/shared/contracts/sse"

import { loadAuthToken } from "./farmer-profile-store"

export interface OnboardingActivationPayload {
  planId: string
  targetDate: string
  activitiesCount: number
  checkinMode: boolean
}

export type OnboardingActivationStatus = "waiting" | "success" | "timeout"

const ACTIVATION_TIMEOUT_MS = 30_000

/**
 * Drives the post-`POST /me/onboarding/complete` waiting screen: connects
 * the shared SSE client (resolved via `container`, never imported
 * directly — see src/shared/contracts/sse.ts), listens for
 * `onboarding_activation_complete`, and gives up after 30s so the UI can
 * show a retry affordance instead of hanging indefinitely.
 */
export function useOnboardingActivation() {
  const [status, setStatus] = useState<OnboardingActivationStatus>("waiting")
  const [payload, setPayload] = useState<OnboardingActivationPayload | null>(null)
  const attemptRef = useRef(0)

  const start = useCallback(() => {
    const attempt = ++attemptRef.current
    setStatus("waiting")
    setPayload(null)

    const sse = container.resolve<SseClient>("sseClient")
    const token = loadAuthToken()

    if (!sse || !token) {
      setStatus("timeout")
      return
    }

    sse.connect(token)

    const unsubscribe = sse.on<OnboardingActivationPayload>(
      "onboarding_activation_complete",
      (data) => {
        if (attemptRef.current !== attempt) return
        setPayload(data)
        setStatus("success")
      },
    )

    const timer = setTimeout(() => {
      if (attemptRef.current !== attempt) return
      setStatus((current) => (current === "success" ? current : "timeout"))
    }, ACTIVATION_TIMEOUT_MS)

    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const cleanup = start()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, payload, retry: start }
}
