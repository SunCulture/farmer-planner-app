import Config from "@/config"
import type {
  SseClient,
  SseEventHandler,
  SseEventName,
  SseUnsubscribe,
} from "@/shared/contracts/sse"

import { parseSseChunk } from "./parse-sse-stream"

const RECONNECT_DELAY_MS = 3000

/**
 * `SseClient` implementation backed by `XMLHttpRequest`.
 *
 * React Native (Hermes) has no global `EventSource`, unlike a browser, so a
 * literal port of the pattern documented in
 * tujiweze-backend/docs/FRONTEND-Activity-QA.md §1 (`new EventSource(...)`)
 * isn't available here. `XMLHttpRequest` is globally available in RN and
 * exposes partial `responseText` while the request is still streaming
 * (`readyState === LOADING`), which is the standard technique for
 * implementing SSE on RN without extra native modules. We read only the
 * newly-arrived tail of `responseText` on each progress tick and feed it
 * through `parseSseChunk`.
 *
 * Connects to `GET /api/me/events?token=<token>` — native/RN HTTP clients
 * can't attach a custom `Authorization` header to a long-lived streaming
 * GET the way `apisauce`'s axios instance does for normal requests, so this
 * uses the query-param auth fallback the backend documents instead.
 *
 * Reconnects with a fixed delay on error or stream end (mirroring the
 * "browser auto-reconnects on error" behavior of native `EventSource`)
 * for as long as `connect()` has been called and `disconnect()` has not.
 */
export class EventSourceSseClient implements SseClient {
  private xhr: XMLHttpRequest | null = null
  private listeners = new Map<SseEventName, Set<SseEventHandler>>()
  private buffer = ""
  private processedLength = 0
  private token: string | null = null
  private connected = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect(token: string): void {
    if (this.xhr || this.token) return // already connected/connecting — idempotent
    this.token = token
    this.open()
  }

  disconnect(): void {
    this.token = null
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.xhr) {
      this.xhr.abort()
      this.xhr = null
    }
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  on<T = unknown>(event: SseEventName, handler: SseEventHandler<T>): SseUnsubscribe {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(handler as SseEventHandler)
    return () => {
      set!.delete(handler as SseEventHandler)
    }
  }

  private open(): void {
    if (!this.token) return

    const url = `${Config.API_URL}/api/me/events?token=${encodeURIComponent(this.token)}`
    const xhr = new XMLHttpRequest()
    this.xhr = xhr
    this.buffer = ""
    this.processedLength = 0

    xhr.open("GET", url, true)
    xhr.setRequestHeader("Accept", "text/event-stream")

    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) {
        this.connected = true
      }
      if (xhr.readyState === xhr.LOADING || xhr.readyState === xhr.DONE) {
        this.consumeNewText(xhr.responseText ?? "")
      }
      if (xhr.readyState === xhr.DONE) {
        this.connected = false
        this.xhr = null
        this.scheduleReconnect()
      }
    }

    xhr.onerror = () => {
      this.connected = false
      this.xhr = null
      this.scheduleReconnect()
    }

    xhr.send()
  }

  private consumeNewText(fullResponseText: string): void {
    if (fullResponseText.length <= this.processedLength) return
    const newText = fullResponseText.slice(this.processedLength)
    this.processedLength = fullResponseText.length

    const { events, remainder } = parseSseChunk(this.buffer + newText)
    this.buffer = remainder

    for (const evt of events) {
      if (evt.event === "ping") continue // heartbeat — no-op by design

      const handlers = this.listeners.get(evt.event as SseEventName)
      if (!handlers || handlers.size === 0) continue

      let parsed: unknown = evt.data
      try {
        parsed = evt.data ? JSON.parse(evt.data) : undefined
      } catch {
        // Non-JSON payload — hand the raw string to subscribers.
      }

      handlers.forEach((handler) => handler(parsed))
    }
  }

  private scheduleReconnect(): void {
    if (!this.token || this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.token) this.open()
    }, RECONNECT_DELAY_MS)
  }
}

export default EventSourceSseClient
