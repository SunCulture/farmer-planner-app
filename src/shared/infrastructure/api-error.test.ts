import { ApiRequestError } from "@/services/api/unwrap"

import { getApiErrorMessage, getValidationDetails } from "./api-error"

describe("getValidationDetails / getApiErrorMessage", () => {
  it("surfaces the first Zod fieldError", () => {
    const error = new ApiRequestError("Invalid request body", "VALIDATION_ERROR", 400, {
      formErrors: [],
      fieldErrors: {
        helpersLevel: [
          "Invalid enum value. Expected 'SOLO' | 'SMALL_TEAM' | 'LARGE_TEAM', received 'WITH_HELPERS'",
        ],
      },
    })

    expect(getValidationDetails(error)).toEqual([
      "helpersLevel: Invalid enum value. Expected 'SOLO' | 'SMALL_TEAM' | 'LARGE_TEAM', received 'WITH_HELPERS'",
    ])
    expect(getApiErrorMessage(error)).toBe(
      "helpersLevel: Invalid enum value. Expected 'SOLO' | 'SMALL_TEAM' | 'LARGE_TEAM', received 'WITH_HELPERS'",
    )
  })

  it("falls back to the API message when details are empty", () => {
    const error = new ApiRequestError("Invalid request body", "VALIDATION_ERROR", 400, {
      formErrors: [],
      fieldErrors: {},
    })
    expect(getApiErrorMessage(error)).toBe("Invalid request body")
  })
})
