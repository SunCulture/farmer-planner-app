import type { ApiResponse } from "apisauce"

import { ApiRequestError } from "@/services/api/unwrap"

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (Array.isArray(error.details)) {
      return `${error.message}: ${error.details.join(", ")}`
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Something went wrong"
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.code === "NOT_FOUND" || error.status === 404)
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401
}

export function isValidationError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.code === "VALIDATION_ERROR" || error.code === "UNPROCESSABLE" || error.status === 422)
  )
}

export function getValidationDetails(error: unknown): string[] {
  if (!(error instanceof ApiRequestError)) return []
  if (Array.isArray(error.details)) return error.details.map(String)
  if (
    error.details &&
    typeof error.details === "object" &&
    "formErrors" in error.details &&
    Array.isArray((error.details as { formErrors: unknown }).formErrors)
  ) {
    return (error.details as { formErrors: string[] }).formErrors
  }
  return []
}

export function problemFromResponse(response: ApiResponse<unknown>): ApiRequestError | null {
  try {
    const body = response.data as { error?: { code: string; message: string; details?: unknown } }
    if (body?.error) {
      return new ApiRequestError(
        body.error.message,
        body.error.code,
        response.status ?? undefined,
        body.error.details,
      )
    }
  } catch {
    // ignore
  }
  return null
}
