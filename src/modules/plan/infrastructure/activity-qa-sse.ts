import Config from "@/config"

type SSEHandler = (payload: unknown) => void

const listeners = new Map<string, Set<SSEHandler>>()

let eventSource: EventSource | null = null
let lastToken: string | null = null

const TRACKED_EVENTS = ["activity_answer_stream", "activity_refined", "ping"] as const

function buildUrl(token: string): string {
  const base = String(Config.API_URL ?? "").replace(/\/$/, "")
  const path = "/api/me/events"
  const url = base ? `${base}${path}` : path
  return `${url}?token=${encodeURIComponent(token)}`
}

function emit(eventName: string, payload: unknown) {
  const set = listeners.get(eventName)
  if (!set) return
  for (const handler of set) {
    try {
      handler(payload)
    } catch (error) {
      console.error(`[activity-qa-sse] handler failed for ${eventName}`, error)
    }
  }
}

function onRawEvent(eventName: string, event: MessageEvent) {
  try {
    const payload = JSON.parse(event.data)
    emit(eventName, payload)
  } catch (error) {
    console.warn(`[activity-qa-sse] failed parsing event ${eventName}`, error)
  }
}

export function connectActivitySSE(token: string): EventSource | null {
  if (!token) return null
  if (eventSource && lastToken === token) return eventSource
  if (typeof EventSource === "undefined") {
    console.warn("[activity-qa-sse] EventSource is unavailable on this platform")
    return null
  }

  if (eventSource) {
    eventSource.close()
    eventSource = null
  }

  lastToken = token
  eventSource = new EventSource(buildUrl(token))
  for (const eventName of TRACKED_EVENTS) {
    if (eventName === "ping") {
      eventSource.addEventListener("ping", () => {})
      continue
    }
    eventSource.addEventListener(eventName, (event) => onRawEvent(eventName, event as MessageEvent))
  }
  eventSource.onerror = (error) => {
    console.warn("[activity-qa-sse] stream error; waiting for auto-reconnect", error)
  }

  return eventSource
}

export function disconnectActivitySSE() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  lastToken = null
}

export function subscribeActivitySSE(eventName: string, handler: SSEHandler): () => void {
  const set = listeners.get(eventName) ?? new Set<SSEHandler>()
  set.add(handler)
  listeners.set(eventName, set)
  return () => {
    const target = listeners.get(eventName)
    if (!target) return
    target.delete(handler)
    if (target.size === 0) listeners.delete(eventName)
  }
}
