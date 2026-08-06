// Mock data — replace with API responses when backend is available

export type Difficulty = "Easy" | "Medium" | "Hard"
export type Priority = "High" | "Medium" | "Low"

export type WeatherData = {
  city: string
  condition: string
  description: string
  temperature: number
}

export type AIInsight = {
  id: string
  text: string
}

export type FarmPlanTemplate = {
  id: string
  name: string
  days: number
  difficulty: Difficulty
  bgColor: string
}

export type TodayActivity = {
  id: string
  name: string
  priority: Priority
  durationMinutes: number
  done: boolean
}

export const MOCK_WEATHER: WeatherData = {
  city: "Kisumu",
  condition: "Sunny",
  description: "Good planting weather · Low humidity",
  temperature: 24,
}

export const MOCK_AI_INSIGHT: AIInsight = {
  id: "insight-1",
  text: "Water your crops before 9am today — soil moisture is low and absorption peaks in the morning.",
}

export const MOCK_FARM_PLANS: FarmPlanTemplate[] = [
  {
    id: "tomato-5",
    name: "5-Day Tomato Plan",
    days: 5,
    difficulty: "Easy",
    bgColor: "#FFFFFF",
  },
  {
    id: "maize-20",
    name: "20-Day Maize Boost",
    days: 20,
    difficulty: "Medium",
    bgColor: "#FDF3E7",
  },
  {
    id: "kale-14",
    name: "14-Day Kale Cycle",
    days: 14,
    difficulty: "Easy",
    bgColor: "#EBF5EB",
  },
  {
    id: "beans-30",
    name: "30-Day Bean Master",
    days: 30,
    difficulty: "Hard",
    bgColor: "#FFFFFF",
  },
]

export const MOCK_ACTIVITIES: TodayActivity[] = [
  {
    id: "act-1",
    name: "Water tomatoes",
    priority: "High",
    durationMinutes: 15,
    done: false,
  },
  {
    id: "act-2",
    name: "Apply fertiliser",
    priority: "Medium",
    durationMinutes: 30,
    done: false,
  },
  {
    id: "act-3",
    name: "Inspect bean rows",
    priority: "Low",
    durationMinutes: 20,
    done: false,
  },
]
