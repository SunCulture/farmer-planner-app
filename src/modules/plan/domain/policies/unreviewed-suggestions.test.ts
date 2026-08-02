import { pickBannerDate } from "./unreviewed-suggestions"

describe("pickBannerDate", () => {
  const today = "2026-08-02"
  const tomorrow = "2026-08-03"

  it("prefers today when today has pending suggestions", () => {
    expect(pickBannerDate(today, tomorrow, 2, 1)).toBe(today)
  })

  it("falls back to tomorrow when today has none", () => {
    expect(pickBannerDate(today, tomorrow, 0, 3)).toBe(tomorrow)
  })

  it("returns null when neither day has suggestions", () => {
    expect(pickBannerDate(today, tomorrow, 0, 0)).toBeNull()
  })
})
