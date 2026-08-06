type SessionExpiredListener = () => void

const listeners = new Set<SessionExpiredListener>()
let handling = false

/**
 * Subscribe to unrecoverable auth failures (refresh failed / no refresh token).
 * Returns an unsubscribe function.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Allow a future expiry to fire again after a new session is established. */
export function clearSessionExpiredHandling(): void {
  handling = false
}

/**
 * Notify listeners once per expiry wave. Safe to call from many parallel 401s.
 */
export function notifySessionExpired(): void {
  if (handling) return
  handling = true
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      // listeners must not break other listeners
    }
  }
}
