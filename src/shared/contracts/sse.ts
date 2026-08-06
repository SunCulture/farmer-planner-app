/**
 * Named server-sent events the backend pushes over `GET /api/me/events`.
 * See tujiweze-backend/docs/PRD-AI-Activities.md §6.5 and
 * tujiweze-backend/docs/FRONTEND-Activity-QA.md §1/§3 for payload shapes.
 */
export type SseEventName =
  | "onboarding_activation_complete"
  | "activities_ready"
  | "daily_activities_ready"
  | "activity_queue_updated"
  | "activity_answer_stream"
  | "plan_audit_due"
  | "new_plan_ready"
  | "ping"

export type SseEventHandler<T = unknown> = (data: T) => void

/** Unsubscribe function returned by {@link SseClient.on}. */
export type SseUnsubscribe = () => void

/**
 * Contract for the app-wide SSE connection. Infrastructure implements this;
 * presentation/application code resolves an instance via `container`
 * (`container.resolve<SseClient>("sseClient")`) rather than importing an
 * implementation directly, matching the split used for `SyncEngine`.
 */
export interface SseClient {
  /**
   * Opens the connection using `token` for the `?token=` auth fallback.
   * Idempotent — calling this while already connected is a no-op.
   */
  connect(token: string): void

  /** Closes the connection, if open. Safe to call when already closed. */
  disconnect(): void

  /** Whether the underlying connection is currently open. */
  isConnected(): boolean

  /**
   * Subscribes to a named event. Returns an unsubscribe function.
   * The `ping` heartbeat event does not need a subscriber — the client
   * itself treats it as a no-op.
   */
  on<T = unknown>(event: SseEventName, handler: SseEventHandler<T>): SseUnsubscribe
}

export default SseClient
