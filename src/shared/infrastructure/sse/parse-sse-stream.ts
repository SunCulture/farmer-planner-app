/**
 * Minimal `text/event-stream` (SSE) frame parser.
 *
 * React Native has no built-in `EventSource`, so `EventSourceSseClient`
 * (./event-source-sse-client.ts) reads the response body incrementally via
 * `XMLHttpRequest` and feeds newly-arrived text through this parser. Kept as
 * a pure function (no RN/XHR dependency) so the wire-format parsing can be
 * unit tested without a device/simulator.
 *
 * SSE framing: https://html.spec.whatwg.org/multipage/server-sent-events.html
 * Events are separated by a blank line; each event may contain `event:`,
 * `data:` (repeatable — joined with `\n`), `id:`, and `retry:` fields, plus
 * `:`-prefixed comment lines (used here for heartbeats) which are ignored.
 */
export interface ParsedSseEvent {
  event: string
  data: string
  id?: string
}

/**
 * Parses one buffered stream chunk (which may contain zero, one, or many
 * complete events, plus a trailing partial event) into complete events and
 * the leftover partial text to prepend to the next chunk.
 */
export function parseSseChunk(buffer: string): {
  events: ParsedSseEvent[]
  remainder: string
} {
  const events: ParsedSseEvent[] = []

  // Normalize line endings, then split on the blank-line event separator.
  // A trailing, not-yet-terminated block is kept as the remainder.
  const normalized = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const blocks = normalized.split("\n\n")
  const remainder = blocks.pop() ?? ""

  for (const block of blocks) {
    const parsed = parseSseBlock(block)
    if (parsed) events.push(parsed)
  }

  return { events, remainder }
}

function parseSseBlock(block: string): ParsedSseEvent | null {
  let eventName = "message"
  const dataLines: string[] = []
  let id: string | undefined

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trimEnd()
    if (!line || line.startsWith(":")) continue // blank/comment (heartbeat)

    const separatorIndex = line.indexOf(":")
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    let value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1)
    if (value.startsWith(" ")) value = value.slice(1)

    if (field === "event") eventName = value
    else if (field === "data") dataLines.push(value)
    else if (field === "id") id = value
    // "retry" and unknown fields are ignored — reconnect backoff is
    // handled by EventSourceSseClient itself.
  }

  if (dataLines.length === 0 && eventName === "message") return null

  return { event: eventName, data: dataLines.join("\n"), id }
}
