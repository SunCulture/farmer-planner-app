import {
  iconKeyToEmoji,
  mapActivityDetail,
  getActivityErrorMessage,
  isActivityNotFoundError,
  ActivityDetailError,
} from "./activity-detail-service"

describe("mapActivityDetail", () => {
  test("maps presenter payload into domain ActivityDetail", () => {
    const detail = mapActivityDetail({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Scout for fall armyworm",
      subtitle: "Protection · ~20 min",
      description: "Walk the field edges.",
      educationBrief: "Early scouting prevents losses.",
      status: { code: "PENDING", label: "Not started", color: "amber" },
      iconKey: "pest-scout",
      highlight: { text: "Check underside of leaves", addedAt: "2026-08-05T10:00:00.000Z" },
      planId: "plan-1",
      date: "2026-08-05",
      completion: null,
    })

    expect(detail.title).toBe("Scout for fall armyworm")
    expect(detail.educationBrief).toContain("scouting")
    expect(detail.iconEmoji).toBe("")
    expect(detail.status.code).toBe("PENDING")
    expect(detail.highlight?.text).toContain("underside")
  })

  test("defaults missing status and icon", () => {
    const detail = mapActivityDetail({
      id: "a",
      title: "Task",
      highlight: null,
    })
    expect(detail.status.label).toBe("Not started")
    expect(detail.iconKey).toBe("task")
    expect(detail.iconEmoji).toBe("")
  })
})

describe("iconKeyToEmoji", () => {
  test("returns empty string (emoji icons removed)", () => {
    expect(iconKeyToEmoji("water")).toBe("")
    expect(iconKeyToEmoji("unknown-key")).toBe("")
    expect(iconKeyToEmoji(null)).toBe("")
  })
})

describe("activity error helpers", () => {
  test("formats not-found and connection errors", () => {
    expect(getActivityErrorMessage(new ActivityDetailError("not-found", "x"))).toBe(
      "Activity not found",
    )
    expect(getActivityErrorMessage(new ActivityDetailError("cannot-connect", "x", true))).toMatch(
      /reach the server/i,
    )
    expect(isActivityNotFoundError(new ActivityDetailError("not-found", "x"))).toBe(true)
    expect(isActivityNotFoundError(new Error("nope"))).toBe(false)
  })
})
