import { addDaysToDateStr, toDateStr, todayDateStr } from "./date-utils"

describe("date-utils", () => {
  it("formats a Date as YYYY-MM-DD", () => {
    expect(toDateStr(new Date(2026, 5, 3))).toBe("2026-06-03")
  })

  it("pads single-digit months and days", () => {
    expect(toDateStr(new Date(2026, 0, 9))).toBe("2026-01-09")
  })

  it("adds days across a month boundary", () => {
    expect(addDaysToDateStr("2026-06-30", 1)).toBe("2026-07-01")
  })

  it("adds negative days", () => {
    expect(addDaysToDateStr("2026-06-01", -1)).toBe("2026-05-31")
  })

  it("todayDateStr delegates to toDateStr for the given moment", () => {
    const now = new Date(2026, 7, 2)
    expect(todayDateStr(now)).toBe("2026-08-02")
  })
})
