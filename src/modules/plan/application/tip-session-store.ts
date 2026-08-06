import { load, save } from "@/utils/storage"

import {
  emptyTipSession,
  type EducationTipSession,
  type TipCloseKind,
  type TipSessionPhase,
} from "../domain/entities/education-tip-session"

const STORAGE_KEY = "plan.educationTipSessions.v1"

type SessionMap = Record<string, EducationTipSession>

type Listener = () => void

const listeners = new Set<Listener>()
/** Stable snapshots for useSyncExternalStore (same ref when unchanged). */
const snapshotCache = new Map<string, EducationTipSession>()

function emit(): void {
  listeners.forEach((listener) => listener())
}

function readMap(): SessionMap {
  return load<SessionMap>(STORAGE_KEY) ?? {}
}

function writeMap(map: SessionMap, options?: { emit?: boolean }): void {
  save(STORAGE_KEY, map)
  for (const [id, session] of Object.entries(map)) {
    snapshotCache.set(id, session)
  }
  if (options?.emit !== false) {
    emit()
  }
}

function cacheSession(session: EducationTipSession): EducationTipSession {
  snapshotCache.set(session.activityId, session)
  return session
}

function normalizeSession(
  activityId: string,
  raw?: Partial<EducationTipSession> | null,
): EducationTipSession {
  const base = emptyTipSession(activityId)
  if (!raw) return base
  return {
    ...base,
    ...raw,
    activityId,
    openCount: raw.openCount ?? 0,
    closeCount: raw.closeCount ?? 0,
    fullRunCount: raw.fullRunCount ?? 0,
    partialExitCount: raw.partialExitCount ?? 0,
    lastCloseKind: raw.lastCloseKind ?? null,
    lastCardIndex: raw.lastCardIndex ?? 0,
    lastPhase: raw.lastPhase ?? "deck",
    lastOpenedAt: raw.lastOpenedAt ?? null,
    lastClosedAt: raw.lastClosedAt ?? null,
    dirty: raw.dirty ?? false,
  }
}

function closeKindForPhase(phase: TipSessionPhase): TipCloseKind {
  return phase === "done" ? "full" : "partial"
}

export function getTipSession(activityId: string): EducationTipSession {
  const cached = snapshotCache.get(activityId)
  if (cached) {
    const normalized = normalizeSession(activityId, cached)
    // Refresh cache if older payloads were missing newer fields.
    if (
      cached.fullRunCount !== normalized.fullRunCount ||
      cached.partialExitCount !== normalized.partialExitCount ||
      cached.lastCloseKind !== normalized.lastCloseKind
    ) {
      return cacheSession(normalized)
    }
    return normalized
  }

  const fromDisk = readMap()[activityId]
  return cacheSession(normalizeSession(activityId, fromDisk))
}

export function subscribeTipSessions(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Increment open count; returns session to resume from (fresh start if last run finished). */
export function recordTipOpen(activityId: string): EducationTipSession {
  const map = readMap()
  const prev = normalizeSession(activityId, map[activityId] ?? getTipSession(activityId))
  const finished = prev.lastPhase === "done"
  const next: EducationTipSession = {
    ...prev,
    activityId,
    openCount: prev.openCount + 1,
    lastOpenedAt: new Date().toISOString(),
    lastCardIndex: finished ? 0 : prev.lastCardIndex,
    lastPhase: finished ? "deck" : prev.lastPhase,
    dirty: true,
  }
  map[activityId] = next
  writeMap(map)
  return next
}

export function recordTipProgress(
  activityId: string,
  cardIndex: number,
  phase: TipSessionPhase,
): EducationTipSession {
  const map = readMap()
  const prev = normalizeSession(activityId, map[activityId] ?? getTipSession(activityId))
  const next: EducationTipSession = {
    ...prev,
    activityId,
    lastCardIndex: Math.max(0, cardIndex),
    lastPhase: phase,
    dirty: true,
  }
  map[activityId] = next
  // Silent: resume cursor only — no UI subscribers need this mid-swipe.
  writeMap(map, { emit: false })
  return next
}

export function recordTipClose(
  activityId: string,
  cardIndex: number,
  phase: TipSessionPhase,
): EducationTipSession {
  const map = readMap()
  const prev = normalizeSession(activityId, map[activityId] ?? getTipSession(activityId))
  const kind = closeKindForPhase(phase)
  const next: EducationTipSession = {
    ...prev,
    activityId,
    closeCount: prev.closeCount + 1,
    fullRunCount: prev.fullRunCount + (kind === "full" ? 1 : 0),
    partialExitCount: prev.partialExitCount + (kind === "partial" ? 1 : 0),
    lastCloseKind: kind,
    lastCardIndex: Math.max(0, cardIndex),
    lastPhase: phase,
    lastClosedAt: new Date().toISOString(),
    dirty: true,
  }
  map[activityId] = next
  writeMap(map)
  return next
}

/** Mark the run finished so the next open starts from the first card. */
export function recordTipFinished(activityId: string): EducationTipSession {
  const map = readMap()
  const prev = normalizeSession(activityId, map[activityId] ?? getTipSession(activityId))
  const next: EducationTipSession = {
    ...prev,
    activityId,
    lastCardIndex: 0,
    lastPhase: "done",
    dirty: true,
  }
  map[activityId] = next
  writeMap(map)
  return next
}

/** Test-only. */
export function __resetTipSessionStoreForTests(): void {
  save(STORAGE_KEY, {})
  snapshotCache.clear()
  listeners.clear()
}
