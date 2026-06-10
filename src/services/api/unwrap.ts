import type { ApiResponse } from "apisauce"

import { getGeneralApiProblem } from "./apiProblem"

export interface ApiEnvelope<T> {
  data: T
  meta?: {
    requestId?: string
    generatedAt?: string
  }
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiRequestError extends Error {
  readonly code: string
  readonly status: number | undefined
  readonly details: unknown

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message)
    this.name = "ApiRequestError"
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Unwraps a successful `{ data, meta }` envelope or throws ApiRequestError.
 */
export function unwrap<T>(response: ApiResponse<ApiEnvelope<T> | ApiErrorBody | unknown>): T {
  if (!response.ok) {
    const body = response.data as ApiErrorBody | undefined
    if (body?.error) {
      throw new ApiRequestError(
        body.error.message,
        body.error.code,
        response.status ?? undefined,
        body.error.details,
      )
    }
    const problem = getGeneralApiProblem(response)
    if (problem) {
      throw new ApiRequestError(problem.kind, problem.kind, response.status ?? undefined)
    }
    throw new ApiRequestError("Request failed", "UNKNOWN", response.status ?? undefined)
  }

  const body = response.data as ApiEnvelope<T> | undefined
  if (body && "data" in body) {
    return body.data
  }

  throw new ApiRequestError("Unexpected response shape", "BAD_DATA", response.status ?? undefined)
}

/**
 * Unwraps public catalog/template responses that are not wrapped in `{ data }`.
 */
export function unwrapRaw<T>(response: ApiResponse<T | ApiErrorBody | unknown>): T {
  if (!response.ok) {
    const body = response.data as ApiErrorBody | undefined
    if (body?.error) {
      throw new ApiRequestError(
        body.error.message,
        body.error.code,
        response.status ?? undefined,
        body.error.details,
      )
    }
    const problem = getGeneralApiProblem(response)
    if (problem) {
      throw new ApiRequestError(problem.kind, problem.kind, response.status ?? undefined)
    }
    throw new ApiRequestError("Request failed", "UNKNOWN", response.status ?? undefined)
  }

  if (response.data === undefined || response.data === null) {
    throw new ApiRequestError("Empty response", "BAD_DATA", response.status ?? undefined)
  }

  if (typeof response.data === "object" && "error" in response.data) {
    const err = (response.data as ApiErrorBody).error
    throw new ApiRequestError(err.message, err.code, response.status ?? undefined, err.details)
  }

  return response.data as T
}
