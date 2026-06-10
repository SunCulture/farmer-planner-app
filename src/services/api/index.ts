import { ApisauceInstance, create } from "apisauce"

import Config from "@/config"
import type { FarmerLocation, HelpersLevel, ProductionType } from "@/modules/onboarding/domain/entities/farmer-profile"

import type {
  ActivityDetailDto,
  DayCompletionsDto,
  DayPlanDto,
  EnrollPlanBody,
  GeneratePlanBody,
  GeneratedPlanDto,
  HomeDataDto,
  PatchPlanBody,
  PlanChatResponseDto,
  PlanRecommendationDto,
  PlanTemplateDto,
} from "./planner-types"
import type { ApiConfig } from "./types"
import { unwrap, unwrapRaw } from "./unwrap"

export { ApiRequestError, unwrap, unwrapRaw } from "./unwrap"
export type { ApiEnvelope, ApiErrorBody } from "./unwrap"
export type * from "./planner-types"

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

  // ---- Home & plans (authenticated) -----------------------------------------

  async getHome(): Promise<HomeDataDto> {
    const response = await this.apisauce.get("/api/me/home")
    return unwrap<HomeDataDto>(response)
  }

  async getPlanRecommendations(): Promise<{ recommendations: PlanRecommendationDto[] }> {
    const response = await this.apisauce.get("/api/me/plans/recommendations")
    return unwrap<{ recommendations: PlanRecommendationDto[] }>(response)
  }

  async generatePlan(body: GeneratePlanBody): Promise<GeneratedPlanDto> {
    const response = await this.apisauce.post("/api/me/plans/generate", body)
    return unwrap<GeneratedPlanDto>(response)
  }

  async enrollPlan(body: EnrollPlanBody): Promise<{ planId: string }> {
    const response = await this.apisauce.post("/api/me/plans", body)
    return unwrap<{ planId: string }>(response)
  }

  async listTemplates(params?: { goal?: string; durationDays?: number }): Promise<{ templates: PlanTemplateDto[] }> {
    const response = await this.apisauce.get("/api/templates", params)
    return unwrapRaw<{ templates: PlanTemplateDto[] }>(response)
  }

  async getDayPlan(date: string): Promise<DayPlanDto> {
    const response = await this.apisauce.get(`/api/me/days/${date}/plan`)
    return unwrap<DayPlanDto>(response)
  }

  async getActivity(activityId: string): Promise<ActivityDetailDto> {
    const response = await this.apisauce.get(`/api/me/activities/${activityId}`)
    return unwrap<ActivityDetailDto>(response)
  }

  async getDayCompletions(date: string): Promise<DayCompletionsDto> {
    const response = await this.apisauce.get(`/api/me/days/${date}/completions`)
    return unwrap<DayCompletionsDto>(response)
  }

  async submitCompletion(activityId: string, formData: FormData): Promise<{
    id: string
    activityId: string
    journalText: string
    photoUrls: string[]
    status: string
    verifiedAt: string | null
  }> {
    const response = await this.apisauce.post(
      `/api/activities/${activityId}/completions`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    )
    return unwrap(response)
  }

  async chatPlan(planId: string, message: string): Promise<PlanChatResponseDto> {
    const response = await this.apisauce.post(`/api/me/plans/${planId}/chat`, { message })
    return unwrap<PlanChatResponseDto>(response)
  }

  async patchPlan(planId: string, body: PatchPlanBody): Promise<{ planId: string; updated: boolean }> {
    const response = await this.apisauce.patch(`/api/me/plans/${planId}`, body)
    return unwrap<{ planId: string; updated: boolean }>(response)
  }
}

export const api = new Api()
