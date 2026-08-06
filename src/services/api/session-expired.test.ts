import {
  clearSessionExpiredHandling,
  notifySessionExpired,
  onSessionExpired,
} from "./session-expired"

describe("session-expired", () => {
  beforeEach(() => {
    clearSessionExpiredHandling()
  })

  it("notifies subscribers once per expiry wave", () => {
    const listener = jest.fn()
    const unsubscribe = onSessionExpired(listener)

    notifySessionExpired()
    notifySessionExpired()

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it("allows another notify after clearSessionExpiredHandling", () => {
    const listener = jest.fn()
    onSessionExpired(listener)

    notifySessionExpired()
    clearSessionExpiredHandling()
    notifySessionExpired()

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("unsubscribes cleanly", () => {
    const listener = jest.fn()
    const unsubscribe = onSessionExpired(listener)
    unsubscribe()

    notifySessionExpired()

    expect(listener).not.toHaveBeenCalled()
  })
})
