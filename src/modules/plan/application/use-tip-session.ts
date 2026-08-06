import { useCallback, useSyncExternalStore } from "react"

import type { TipSessionPhase } from "../domain/entities/education-tip-session"
import {
  getTipSession,
  recordTipClose,
  recordTipFinished,
  recordTipOpen,
  recordTipProgress,
  subscribeTipSessions,
} from "./tip-session-store"

/** Subscribe to tip-session changes (e.g. open count on the CTA). */
export function useTipSession(activityId: string) {
  return useSyncExternalStore(
    subscribeTipSessions,
    () => getTipSession(activityId),
    () => getTipSession(activityId),
  )
}

/** Imperative writers — no subscription (safe to call from gestures / setState). */
export function useTipSessionActions(activityId: string) {
  const onOpen = useCallback(() => recordTipOpen(activityId), [activityId])
  const onProgress = useCallback(
    (cardIndex: number, phase: TipSessionPhase) => recordTipProgress(activityId, cardIndex, phase),
    [activityId],
  )
  const onClose = useCallback(
    (cardIndex: number, phase: TipSessionPhase) => recordTipClose(activityId, cardIndex, phase),
    [activityId],
  )
  const onFinished = useCallback(() => recordTipFinished(activityId), [activityId])

  return { onOpen, onProgress, onClose, onFinished }
}
