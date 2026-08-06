import {
  emptyTipSession,
  tipEngagementLabel,
  type EducationTipSession,
} from "../domain/entities/education-tip-session"
import {
  __resetTipSessionStoreForTests,
  getTipSession,
  recordTipClose,
  recordTipFinished,
  recordTipOpen,
  recordTipProgress,
} from "../application/tip-session-store"

describe("tip-session-store", () => {
  beforeEach(() => {
    __resetTipSessionStoreForTests()
  })

  it("starts empty and increments open/close counts", () => {
    expect(getTipSession("a1")).toEqual(emptyTipSession("a1"))

    const opened = recordTipOpen("a1")
    expect(opened.openCount).toBe(1)
    expect(opened.lastPhase).toBe("deck")

    recordTipProgress("a1", 2, "deck")
    const closed = recordTipClose("a1", 2, "deck")
    expect(closed.closeCount).toBe(1)
    expect(closed.partialExitCount).toBe(1)
    expect(closed.fullRunCount).toBe(0)
    expect(closed.lastCloseKind).toBe("partial")
    expect(closed.lastCardIndex).toBe(2)
  })

  it("counts a full run when closing after done", () => {
    recordTipOpen("a1")
    recordTipFinished("a1")
    const closed = recordTipClose("a1", 0, "done")
    expect(closed.fullRunCount).toBe(1)
    expect(closed.partialExitCount).toBe(0)
    expect(closed.lastCloseKind).toBe("full")
  })

  it("resumes mid-deck after partial close, then resets after finished", () => {
    recordTipOpen("a1")
    recordTipClose("a1", 3, "deck")

    const resumed = recordTipOpen("a1")
    expect(resumed.openCount).toBe(2)
    expect(resumed.lastCardIndex).toBe(3)
    expect(resumed.lastPhase).toBe("deck")
    expect(resumed.partialExitCount).toBe(1)

    recordTipFinished("a1")
    recordTipClose("a1", 0, "done")
    const review = recordTipOpen("a1")
    expect(review.openCount).toBe(3)
    expect(review.lastCardIndex).toBe(0)
    expect(review.lastPhase).toBe("deck")
    expect(review.fullRunCount).toBe(1)
    expect(review.partialExitCount).toBe(1)
  })

  it("normalizes missing full/partial counts from older payloads", () => {
    const { save } = require("@/utils/storage") as typeof import("@/utils/storage")
    save("plan.educationTipSessions.v1", {
      a1: {
        activityId: "a1",
        openCount: 1,
        closeCount: 0,
        lastCardIndex: 0,
        lastPhase: "deck",
        lastOpenedAt: "2026-08-06T12:00:00.000Z",
        lastClosedAt: null,
        dirty: true,
      },
    })
    const session = getTipSession("a1")
    expect(session.fullRunCount).toBe(0)
    expect(session.partialExitCount).toBe(0)
    expect(session.lastCloseKind).toBe(null)
  })

  it("marks dirty for later sync", () => {
    const session: EducationTipSession = recordTipOpen("a1")
    expect(session.dirty).toBe(true)
  })
})

describe("tipEngagementLabel", () => {
  it("shows open count before any close", () => {
    expect(tipEngagementLabel({ ...emptyTipSession("a1"), openCount: 2 })).toBe("2×")
  })

  it("shows full and mid breakdown after closes", () => {
    expect(
      tipEngagementLabel({
        ...emptyTipSession("a1"),
        openCount: 3,
        closeCount: 3,
        fullRunCount: 2,
        partialExitCount: 1,
      }),
    ).toBe("2 full · 1 mid")
  })

  it("shows only mid when no full runs", () => {
    expect(
      tipEngagementLabel({
        ...emptyTipSession("a1"),
        closeCount: 2,
        partialExitCount: 2,
      }),
    ).toBe("2 mid")
  })
})
