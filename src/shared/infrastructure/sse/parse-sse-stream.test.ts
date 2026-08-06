import { parseSseChunk } from "./parse-sse-stream"

describe("parseSseChunk", () => {
  it("parses a single complete named event", () => {
    const { events, remainder } = parseSseChunk("event: ping\ndata: {}\n\n")
    expect(events).toEqual([{ event: "ping", data: "{}", id: undefined }])
    expect(remainder).toBe("")
  })

  it("parses multiple complete events in one chunk", () => {
    const chunk = 'event: activities_ready\ndata: {"planId":"p1"}\n\n' + "event: ping\ndata: {}\n\n"
    const { events, remainder } = parseSseChunk(chunk)
    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ event: "activities_ready", data: '{"planId":"p1"}', id: undefined })
    expect(events[1].event).toBe("ping")
    expect(remainder).toBe("")
  })

  it("holds back an incomplete trailing event as the remainder", () => {
    const chunk = 'event: onboarding_activation_complete\ndata: {"planId":"p1"'
    const { events, remainder } = parseSseChunk(chunk)
    expect(events).toEqual([])
    expect(remainder).toBe(chunk)
  })

  it("stitches a chunk split mid-event back together via remainder + next call", () => {
    const first = parseSseChunk('event: new_plan_ready\ndata: {"planId"')
    expect(first.events).toEqual([])

    const second = parseSseChunk(first.remainder + ':"p2"}\n\n')
    expect(second.events).toEqual([
      { event: "new_plan_ready", data: '{"planId":"p2"}', id: undefined },
    ])
  })

  it("joins multiple data: lines with newlines", () => {
    const { events } = parseSseChunk("event: activity_answer_stream\ndata: line1\ndata: line2\n\n")
    expect(events[0].data).toBe("line1\nline2")
  })

  it("captures an id field", () => {
    const { events } = parseSseChunk("id: 42\nevent: ping\ndata: {}\n\n")
    expect(events[0].id).toBe("42")
  })

  it("ignores comment-only heartbeat blocks", () => {
    const { events, remainder } = parseSseChunk(": keep-alive\n\nevent: ping\ndata: {}\n\n")
    expect(events).toEqual([{ event: "ping", data: "{}", id: undefined }])
    expect(remainder).toBe("")
  })

  it("defaults to a 'message' event name when none is given", () => {
    const { events } = parseSseChunk("data: hello\n\n")
    expect(events[0].event).toBe("message")
  })
})
