export const plannerKeys = {
  all: ["planner"] as const,
  home: () => ["planner", "home"] as const,
  dayPlan: (date: string) => ["planner", "dayPlan", date] as const,
  dayCompletions: (date: string) => ["planner", "completions", date] as const,
  activity: (id: string) => ["planner", "activity", id] as const,
  recommendations: () => ["planner", "recommendations"] as const,
  templates: (filters: { goal?: string; durationDays?: number }) =>
    ["planner", "templates", filters] as const,
}

export default plannerKeys
