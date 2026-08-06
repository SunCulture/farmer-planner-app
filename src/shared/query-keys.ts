export const plannerKeys = {
  all: ["planner"] as const,
  home: () => ["planner", "home"] as const,
  dayPlan: (date: string) => ["planner", "dayPlan", date] as const,
  dayCompletions: (date: string) => ["planner", "completions", date] as const,
  activity: (id: string) => ["planner", "activity", id] as const,
  activityQuestions: (id: string) => ["planner", "activity", id, "questions"] as const,
  dayActivityQuestions: (date: string) => ["planner", "dayActivityQuestions", date] as const,
  recommendations: () => ["planner", "recommendations"] as const,
  templates: (filters: { goal?: string; durationDays?: number }) =>
    ["planner", "templates", filters] as const,
  suggestions: (date: string) => ["planner", "suggestions", date] as const,
  educationCourses: () => ["planner", "educationCourses"] as const,
}

/** Develop-era plan keys — still used by activity done/skip/contest actions. */
export const planKeys = {
  all: ["plan"] as const,
  day: (date: string) => ["plan", "day", date] as const,
  activity: (activityId: string) => ["plan", "activity", activityId] as const,
  activityQuestions: (activityId: string) => ["plan", "activity-questions", activityId] as const,
  dayActivityQuestions: (date: string) => ["plan", "day-activity-questions", date] as const,
}

export default plannerKeys
