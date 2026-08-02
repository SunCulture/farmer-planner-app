import {
  __resetActivitySuggestionsSheetStoreForTests,
  closeActivitySuggestionsSheet,
  getActivitySuggestionsSheetState,
  openActivitySuggestionsSheet,
  subscribeActivitySuggestionsSheet,
} from "./activity-suggestions-sheet-store"

describe("activity-suggestions-sheet-store", () => {
  beforeEach(() => {
    __resetActivitySuggestionsSheetStoreForTests()
  })

  it("starts closed", () => {
    expect(getActivitySuggestionsSheetState()).toEqual({ isOpen: false, date: null })
  })

  it("opens with the given date and notifies subscribers", () => {
    const listener = jest.fn()
    subscribeActivitySuggestionsSheet(listener)

    openActivitySuggestionsSheet("2026-08-02")

    expect(getActivitySuggestionsSheetState()).toEqual({ isOpen: true, date: "2026-08-02" })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("closes while retaining the last date (revisitable)", () => {
    openActivitySuggestionsSheet("2026-08-02")
    const listener = jest.fn()
    subscribeActivitySuggestionsSheet(listener)

    closeActivitySuggestionsSheet()

    expect(getActivitySuggestionsSheetState()).toEqual({ isOpen: false, date: "2026-08-02" })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("is a no-op to close an already-closed sheet", () => {
    const listener = jest.fn()
    subscribeActivitySuggestionsSheet(listener)

    closeActivitySuggestionsSheet()

    expect(listener).not.toHaveBeenCalled()
  })

  it("unsubscribe stops future notifications", () => {
    const listener = jest.fn()
    const unsubscribe = subscribeActivitySuggestionsSheet(listener)
    unsubscribe()

    openActivitySuggestionsSheet("2026-08-02")

    expect(listener).not.toHaveBeenCalled()
  })
})
