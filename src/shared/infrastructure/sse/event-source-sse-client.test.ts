import { EventSourceSseClient } from "./event-source-sse-client"

/**
 * Minimal fake of the subset of `XMLHttpRequest` `EventSourceSseClient`
 * relies on, so the connect/subscribe/dispatch/unsubscribe/reconnect
 * contract can be exercised without a real device or network.
 */
class FakeXHR {
  static readonly UNSENT = 0
  static readonly OPENED = 1
  static readonly HEADERS_RECEIVED = 2
  static readonly LOADING = 3
  static readonly DONE = 4

  readonly UNSENT = FakeXHR.UNSENT
  readonly OPENED = FakeXHR.OPENED
  readonly HEADERS_RECEIVED = FakeXHR.HEADERS_RECEIVED
  readonly LOADING = FakeXHR.LOADING
  readonly DONE = FakeXHR.DONE

  readyState = FakeXHR.UNSENT
  responseText = ""
  onreadystatechange: (() => void) | null = null
  onerror: (() => void) | null = null
  aborted = false

  open = jest.fn()
  setRequestHeader = jest.fn()
  send = jest.fn()

  abort() {
    this.aborted = true
  }

  // ---- test helpers, not part of the real XHR surface ----------------------

  emitProgress(appendText: string, readyState: number = FakeXHR.LOADING) {
    this.responseText += appendText
    this.readyState = readyState
    this.onreadystatechange?.()
  }

  emitError() {
    this.onerror?.()
  }
}

describe("EventSourceSseClient", () => {
  let instances: FakeXHR[]
  let originalXHR: typeof XMLHttpRequest

  beforeEach(() => {
    jest.useFakeTimers()
    instances = []
    originalXHR = (global as any).XMLHttpRequest
    ;(global as any).XMLHttpRequest = jest.fn(() => {
      const xhr = new FakeXHR()
      instances.push(xhr)
      return xhr
    })
  })

  afterEach(() => {
    ;(global as any).XMLHttpRequest = originalXHR
    jest.useRealTimers()
  })

  it("opens a streaming GET with the token as a query param on connect()", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")

    expect(instances).toHaveLength(1)
    expect(instances[0].open).toHaveBeenCalledWith(
      "GET",
      expect.stringContaining("/api/me/events?token=tok-123"),
      true,
    )
  })

  it("is idempotent — a second connect() while connected opens no new request", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    client.connect("tok-456")

    expect(instances).toHaveLength(1)
  })

  it("dispatches a parsed event to subscribers of that event name", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    const handler = jest.fn()
    client.on("onboarding_activation_complete", handler)

    instances[0].emitProgress(
      'event: onboarding_activation_complete\ndata: {"planId":"p1","targetDate":"2026-08-03","activitiesCount":3,"checkinMode":true}\n\n',
    )

    expect(handler).toHaveBeenCalledWith({
      planId: "p1",
      targetDate: "2026-08-03",
      activitiesCount: 3,
      checkinMode: true,
    })
  })

  it("treats ping as a no-op and never calls a ping subscriber's handler logic path", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    const pingHandler = jest.fn()
    client.on("ping", pingHandler)

    instances[0].emitProgress("event: ping\ndata: {}\n\n")

    expect(pingHandler).not.toHaveBeenCalled()
  })

  it("only notifies subscribers of the matching event name", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    const onboardingHandler = jest.fn()
    const activitiesHandler = jest.fn()
    client.on("onboarding_activation_complete", onboardingHandler)
    client.on("activities_ready", activitiesHandler)

    instances[0].emitProgress('event: activities_ready\ndata: {"planId":"p1"}\n\n')

    expect(activitiesHandler).toHaveBeenCalledWith({ planId: "p1" })
    expect(onboardingHandler).not.toHaveBeenCalled()
  })

  it("stops notifying a handler after it unsubscribes", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    const handler = jest.fn()
    const unsubscribe = client.on("ping", handler)
    unsubscribe()

    instances[0].emitProgress("event: ping\ndata: {}\n\n")
    // ping is a no-op regardless, so assert via a different event instead
    const otherHandler = jest.fn()
    const unsubscribeOther = client.on("new_plan_ready", otherHandler)
    unsubscribeOther()
    instances[0].emitProgress('event: new_plan_ready\ndata: {"planId":"p2"}\n\n')

    expect(otherHandler).not.toHaveBeenCalled()
  })

  it("reassembles an event split across multiple progress ticks", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    const handler = jest.fn()
    client.on("new_plan_ready", handler)

    instances[0].emitProgress('event: new_plan_ready\ndata: {"planId"')
    expect(handler).not.toHaveBeenCalled()
    instances[0].emitProgress(':"p3"}\n\n')

    expect(handler).toHaveBeenCalledWith({ planId: "p3" })
  })

  it("marks isConnected() true once headers arrive and false once the stream ends", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    expect(client.isConnected()).toBe(false)

    instances[0].readyState = FakeXHR.HEADERS_RECEIVED
    instances[0].onreadystatechange?.()
    expect(client.isConnected()).toBe(true)

    instances[0].readyState = FakeXHR.DONE
    instances[0].onreadystatechange?.()
    expect(client.isConnected()).toBe(false)
  })

  it("reconnects automatically after the stream ends", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    instances[0].readyState = FakeXHR.DONE
    instances[0].onreadystatechange?.()

    expect(instances).toHaveLength(1)
    jest.advanceTimersByTime(3000)
    expect(instances).toHaveLength(2)
  })

  it("reconnects automatically after a transport error", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    instances[0].emitError()

    jest.advanceTimersByTime(3000)
    expect(instances).toHaveLength(2)
  })

  it("aborts the in-flight request and stops reconnecting after disconnect()", () => {
    const client = new EventSourceSseClient()
    client.connect("tok-123")
    client.disconnect()

    expect(instances[0].aborted).toBe(true)
    expect(client.isConnected()).toBe(false)

    jest.advanceTimersByTime(10_000)
    expect(instances).toHaveLength(1) // no reconnect after an explicit disconnect

    // connect() works again after disconnect (idempotent guard was cleared)
    client.connect("tok-456")
    expect(instances).toHaveLength(2)
  })
})
