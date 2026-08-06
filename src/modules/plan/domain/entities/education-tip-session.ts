/** Local tip-deck engagement — MMKV now, backend sync later. */
export type TipSessionPhase = "deck" | "rate" | "done"

/** Whether the last close finished the tip course or left mid-way. */
export type TipCloseKind = "full" | "partial"

export interface EducationTipSession {
  activityId: string
  /** Times the tips modal was opened. */
  openCount: number
  /** Times the tips modal was closed (including finish/skip). */
  closeCount: number
  /** Closes after a full tip run (deck finished + rate/skip). */
  fullRunCount: number
  /** Closes that exited mid-deck or on the rating step. */
  partialExitCount: number
  lastCloseKind: TipCloseKind | null
  /** Card index to resume at when reopening mid-deck. */
  lastCardIndex: number
  lastPhase: TipSessionPhase
  lastOpenedAt: string | null
  lastClosedAt: string | null
  /** True until we push this session to the API. */
  dirty: boolean
}

export function emptyTipSession(activityId: string): EducationTipSession {
  return {
    activityId,
    openCount: 0,
    closeCount: 0,
    fullRunCount: 0,
    partialExitCount: 0,
    lastCloseKind: null,
    lastCardIndex: 0,
    lastPhase: "deck",
    lastOpenedAt: null,
    lastClosedAt: null,
    dirty: false,
  }
}

/** Compact CTA label: e.g. "2 full · 1 mid" or "3×" before any close. */
export function tipEngagementLabel(session: EducationTipSession): string | null {
  if (session.closeCount > 0) {
    const parts: string[] = []
    if (session.fullRunCount > 0) parts.push(`${session.fullRunCount} full`)
    if (session.partialExitCount > 0) parts.push(`${session.partialExitCount} mid`)
    if (parts.length > 0) return parts.join(" · ")
  }
  if (session.openCount > 0) return `${session.openCount}×`
  return null
}
