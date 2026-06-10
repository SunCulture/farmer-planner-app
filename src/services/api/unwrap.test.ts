import { ApiRequestError, unwrap } from "./unwrap"

describe("unwrap", () => {
  it("returns data from a successful envelope", () => {
    const result = unwrap({
      ok: true,
      status: 200,
      data: { data: { planId: "p1" }, meta: {} },
      problem: null,
      originalError: null,
    } as any)

    expect(result).toEqual({ planId: "p1" })
  })

  it("throws ApiRequestError for error envelope", () => {
    expect(() =>
      unwrap({
        ok: false,
        status: 404,
        data: { error: { code: "NOT_FOUND", message: "No plan found" } },
        problem: "CLIENT_ERROR",
        originalError: null,
      } as any),
    ).toThrow(ApiRequestError)
  })
})
