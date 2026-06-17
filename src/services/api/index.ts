import { ApisauceInstance, create } from "apisauce"

import Config from "@/config"
import type { FarmerLocation, FarmerProfile, HelpersLevel, ProductionType } from "@/modules/onboarding/domain/entities/farmer-profile"

import type { ApiConfig } from "./types"

export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

// ---- Request / Response shapes ------------------------------------------------

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthFarmer {
  id: string
  email: string
  displayName: string
  onboardingCompleted: boolean
  suggestedStep: string | null
}

export interface RegisterBody {
  email: string
  password: string
  name: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface CropItem {
  id: string
  name: string
  slug: string
}

export interface LivestockItem {
  id: string
  name: string
  slug: string
}

export interface GoalItem {
  id: string
  name: string
  slug: string
  illustrationKey: string
}

export interface RegionWeather {
  temperature: number
  feelsLike: number
  humidity: number
  description: string
  windSpeed: number
  iconCode: string
}

export interface RegionItem {
  id: string
  countryId: string
  name: string
  slug: string
  latitude: number
  longitude: number
  weather?: RegionWeather
}

export interface OnboardingStep {
  key: string
  label: string
  done: boolean
}

export interface OnboardingData {
  farmerId: string
  name: string
  location: FarmerLocation | null
  productionType: ProductionType | null
  cropIds: string[]
  livestockIds: string[]
  helpersLevel: HelpersLevel | null
  acreage: number | null
  goalSlugs: string[]
  onboardingCompletedAt: string | null
  suggestedStep: string | null
  steps: OnboardingStep[]
}

export interface PatchOnboardingBody {
  name?: string
  location?: FarmerLocation
  productionType?: ProductionType
  cropIds?: string[]
  livestockIds?: string[]
  helpersLevel?: HelpersLevel
  acreage?: number
  goalSlugs?: string[]
}

export interface ActivityHighlightResponse {
  text: string
  addedAt: string
}

export interface ActivityDetailResponse {
  id: string
  title: string
  subtitle?: string
  description?: string
  status?: { code: string; label: string; color: string }
  iconKey?: string
  highlight: ActivityHighlightResponse | null
  cta?: { label: string; route: string }
  planId?: string
  date?: string
}

export interface AskActivityQuestionBody {
  question: string
}

export interface AskActivityQuestionData {
  questionId: string
  question: string
  status: "pending" | "answered" | "failed"
}

export interface ActivityQuestionItemResponse {
  id?: string
  questionId?: string
  question: string
  answer: string | null
  status: "pending" | "answered" | "failed"
  relatedFaqs?: { question: string; previewAnswer: string }[]
  createdAt: string
}

export interface DayActivityQuestionResponse {
  activityId: string
  activityTitle: string
  highlight: ActivityHighlightResponse | null
  questions: {
    questionId: string
    question: string
    answer: string | null
    createdAt: string
  }[]
}

// ---- Api class ----------------------------------------------------------------

export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  setAuthToken(token: string) {
    this.apisauce.setHeader("Authorization", `Bearer ${token}`)
  }

  clearAuthToken() {
    this.apisauce.deleteHeader("Authorization")
  }

  // ---- Auth ------------------------------------------------------------------

  async register(body: RegisterBody) {
    return this.apisauce.post<{ data: AuthTokens & { farmer: AuthFarmer } }>("/api/auth/register", body)
  }

  async login(body: LoginBody) {
    return this.apisauce.post<{ data: AuthTokens & { farmer: AuthFarmer } }>("/api/auth/login", body)
  }

  async refreshTokens(refreshToken: string) {
    return this.apisauce.post<{ data: AuthTokens }>("/api/auth/refresh", { refreshToken })
  }

  async logout(refreshToken: string) {
    return this.apisauce.post<{ data: { ok: boolean } }>("/api/auth/logout", { refreshToken })
  }

  async getMe() {
    return this.apisauce.get<{ data: { farmer: AuthFarmer } }>("/api/auth/me")
  }

  // ---- Catalog (public) -------------------------------------------------------

  async searchCrops(q?: string) {
    return this.apisauce.get<{ crops: CropItem[] }>("/api/catalog/crops", q ? { q } : undefined)
  }

  async searchLivestock(q?: string) {
    return this.apisauce.get<{ livestock: LivestockItem[] }>("/api/catalog/livestock", q ? { q } : undefined)
  }

  async listGoals() {
    return this.apisauce.get<{ goals: GoalItem[] }>("/api/catalog/goals")
  }

  async listRegions(weather?: boolean) {
    return this.apisauce.get<{ regions: RegionItem[] }>(
      "/api/catalog/regions",
      weather ? { weather: "true" } : undefined,
    )
  }

  // ---- Onboarding (authenticated) --------------------------------------------

  async getOnboarding() {
    return this.apisauce.get<{ data: OnboardingData }>("/api/me/onboarding")
  }

  async patchOnboarding(body: PatchOnboardingBody) {
    return this.apisauce.patch<{ data: OnboardingData }>("/api/me/onboarding", body)
  }

  async completeOnboarding() {
    return this.apisauce.post<{ data: Pick<OnboardingData, "farmerId" | "onboardingCompletedAt" | "suggestedStep" | "steps"> }>("/api/me/onboarding/complete")
  }

  // ---- Activities + Q&A ------------------------------------------------------

  async getDayPlan(date: string) {
    return this.apisauce.get<{ data?: { activities?: ActivityDetailResponse[] }; activities?: ActivityDetailResponse[] }>(
      `/api/me/days/${date}/plan`,
    )
  }

  async getActivityDetail(activityId: string) {
    return this.apisauce.get<{ data?: ActivityDetailResponse; activity?: ActivityDetailResponse }>(
      `/api/me/activities/${activityId}`,
    )
  }

  async askActivityQuestion(activityId: string, body: AskActivityQuestionBody) {
    return this.apisauce.post<{ data: AskActivityQuestionData }>(
      `/api/me/activities/${activityId}/questions`,
      body,
    )
  }

  async getActivityQuestions(activityId: string) {
    return this.apisauce.get<{
      data?: { questions?: ActivityQuestionItemResponse[] }
      questions?: ActivityQuestionItemResponse[]
    }>(`/api/me/activities/${activityId}/questions`)
  }

  async getDayActivityQuestions(date: string) {
    return this.apisauce.get<{
      data?: { activities?: DayActivityQuestionResponse[] }
      activities?: DayActivityQuestionResponse[]
    }>(`/api/me/days/${date}/activity-questions`)
  }
}

export const api = new Api()
