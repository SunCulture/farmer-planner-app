import {
  isValidTwoWeekGoal,
  TWO_WEEK_GOAL_MAX_LENGTH,
  TWO_WEEK_GOAL_MIN_LENGTH,
} from "./two-week-goal"

describe("isValidTwoWeekGoal", () => {
  it("rejects empty/undefined/null input", () => {
    expect(isValidTwoWeekGoal("")).toBe(false)
    expect(isValidTwoWeekGoal(undefined)).toBe(false)
    expect(isValidTwoWeekGoal(null)).toBe(false)
  })

  it("rejects input shorter than the minimum length", () => {
    const tooShort = "a".repeat(TWO_WEEK_GOAL_MIN_LENGTH - 1)
    expect(isValidTwoWeekGoal(tooShort)).toBe(false)
  })

  it("rejects whitespace-only input padded to look long enough", () => {
    expect(isValidTwoWeekGoal("          ")).toBe(false)
  })

  it("trims surrounding whitespace before checking length", () => {
    const padded = `  ${"a".repeat(TWO_WEEK_GOAL_MIN_LENGTH)}  `
    expect(isValidTwoWeekGoal(padded)).toBe(true)
  })

  it("accepts input at exactly the minimum length", () => {
    expect(isValidTwoWeekGoal("a".repeat(TWO_WEEK_GOAL_MIN_LENGTH))).toBe(true)
  })

  it("accepts input at exactly the maximum length", () => {
    expect(isValidTwoWeekGoal("a".repeat(TWO_WEEK_GOAL_MAX_LENGTH))).toBe(true)
  })

  it("rejects input longer than the maximum length", () => {
    expect(isValidTwoWeekGoal("a".repeat(TWO_WEEK_GOAL_MAX_LENGTH + 1))).toBe(false)
  })

  it("accepts a realistic goal", () => {
    expect(isValidTwoWeekGoal("Get my maize planted before the next rains")).toBe(true)
  })
})
