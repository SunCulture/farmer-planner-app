export const expensesKeys = {
  all: ["expenses"] as const,
  categories: () => ["expenses", "categories"] as const,
  routines: () => ["expenses", "routines"] as const,
  events: () => ["expenses", "events"] as const,
  prediction: () => ["expenses", "prediction"] as const,
}

export const planKeys = {
  all: ["plan"] as const,
  day: (date: string) => ["plan", "day", date] as const,
  activity: (activityId: string) => ["plan", "activity", activityId] as const,
  activityQuestions: (activityId: string) => ["plan", "activity-questions", activityId] as const,
  dayActivityQuestions: (date: string) => ["plan", "day-activity-questions", date] as const,
}

/** @deprecated Prefer planKeys — kept for any leftover imports during migration. */
export const plannerKeys = {
  ...planKeys,
  home: () => ["home"] as const,
}

export default expensesKeys
