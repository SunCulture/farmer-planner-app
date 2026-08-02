/**
 * Validation rules for the free-text "2-week goal" onboarding step.
 * Mirrors the backend's `twoWeekGoal is required` completion gate
 * (tujiweze-backend/backend/src/services/onboarding.service.ts) with an
 * additional client-side minimum length so the farmer gets useful,
 * personalisation-worthy input before `POST /me/onboarding/complete`
 * becomes reachable.
 */
export const TWO_WEEK_GOAL_MIN_LENGTH = 10
export const TWO_WEEK_GOAL_MAX_LENGTH = 200

/**
 * Whether `value` is long enough (and not only whitespace) to submit as the
 * farmer's 2-week goal, and short enough to fit the max length constraint.
 */
export function isValidTwoWeekGoal(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim()
  return trimmed.length >= TWO_WEEK_GOAL_MIN_LENGTH && trimmed.length <= TWO_WEEK_GOAL_MAX_LENGTH
}
