import type { ApiResponse } from "apisauce"

import { ApiRequestError } from "@/services/api/unwrap"

type ZodFlattenDetails = {
  formErrors?: unknown
  fieldErrors?: Record<string, string[] | undefined>
}

function isZodFlattenDetails(value: unknown): value is ZodFlattenDetails {
  return typeof value === "object" && value !== null
}

export function getValidationDetails(error: unknown): string[] {
  if (!(error instanceof ApiRequestError)) return []
  if (Array.isArray(error.details)) return error.details.map(String)
  if (!isZodFlattenDetails(error.details)) return []

  const messages: string[] = []
  if (Array.isArray(error.details.formErrors)) {
    messages.push(...error.details.formErrors.map(String))
  }
  if (error.details.fieldErrors && typeof error.details.fieldErrors === "object") {
    for (const [field, fieldMessages] of Object.entries(error.details.fieldErrors)) {
      if (!Array.isArray(fieldMessages)) continue
      for (const message of fieldMessages) {
        messages.push(`${field}: ${message}`)
      }
    }
  }
  return messages
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const details = getValidationDetails(error)
    if (details.length > 0) {
      return details[0]!
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
