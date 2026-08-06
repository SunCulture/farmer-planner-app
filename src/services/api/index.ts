import { ApisauceInstance, create } from "apisauce"
import type { InternalAxiosRequestConfig } from "axios"

import Config from "@/config"
import {
  clearAuthToken,
  loadAuthToken,
  loadRefreshToken,
  saveAuthSession,
} from "@/modules/onboarding/application/farmer-profile-store"
import type {
  FarmerLocation,
  HelpersLevel,
  ProductionType,
} from "@/modules/onboarding/domain/entities/farmer-profile"

import type {
  AcceptSuggestionResponseDto,
  ActivityDetailDto,
  ActivitySuggestionDto,
  AskActivityQuestionResponseDto,
  DayActivityQuestionsDto,
  DayCompletionsDto,
  DayPlanDto,
  EducationCoursesDto,
  EducationProgressDto,
  EnrollPlanBody,
  GeneratePlanBody,
  GeneratedPlanDto,
  HomeDataDto,
  PatchPlanBody,
  PlanChatResponseDto,
  PlanRecommendationDto,
  PlanTemplateDto,
  ActivityQuestionsListDto,
} from "./planner-types"
import {
  clearSessionExpiredHandling,
  notifySessionExpired,
} from "./session-expired"
import type { ApiConfig } from "./types"
import { unwrap, unwrapRaw, unwrapVoid } from "./unwrap"

export { ApiRequestError, unwrap, unwrapRaw, unwrapVoid } from "./unwrap"
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
  /** Free-text farmer goal for the next 2 weeks, captured at the end of onboarding. */
  twoWeekGoal?: string | null
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
  twoWeekGoal?: string
}

/** Reaction payload for POST /api/me/activities/:id/contest */
export type ContestReaction = "too_hard" | "too_easy" | "not_relevant" | "loved_it"

export interface ActivityActionCompletionResponse {
  id: string
  journalText?: string | null
  photoUrls?: string[]
  status: string
  outcomeNote?: string | null
  verifiedAt?: string | null
}

export interface ContestActivityResponse {
  feedbackId: string
  activityId: string
  status: string
  message: string
}

// ---- Api class ----------------------------------------------------------------

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig
  private refreshInFlight: Promise<boolean> | null = null

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
    this.setupAuthInterceptor()

    // Survive Fast Refresh recreating this singleton without re-running bootstrap.
    const existing = loadAuthToken()
    if (existing) this.setAuthToken(existing)
  }

  setAuthToken(token: string) {
    clearSessionExpiredHandling()
    this.apisauce.setHeader("Authorization", `Bearer ${token}`)
  }

  clearAuthToken() {
    this.apisauce.deleteHeader("Authorization")
  }

  /**
   * Exchange the stored refresh token for a new access/refresh pair.
   * Concurrent 401s share one in-flight refresh.
   * On failure, clears tokens and notifies listeners so the UI can redirect to login.
   */
  async refreshSession(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight

    this.refreshInFlight = (async () => {
      try {
        const refreshToken = loadRefreshToken()
        if (!refreshToken) {
          this.expireSession()
          return false
        }

        const res = await this.refreshTokens(refreshToken)
        if (!res.ok || !res.data?.data?.accessToken) {
          this.expireSession()
          return false
        }

        const { accessToken, refreshToken: nextRefresh } = res.data.data
        saveAuthSession(accessToken, nextRefresh)
        this.setAuthToken(accessToken)
        return true
      } catch {
        this.expireSession()
        return false
      } finally {
        this.refreshInFlight = null
      }
    })()

    return this.refreshInFlight
  }

  /** Clear stored credentials and notify the app to leave authenticated screens. */
  private expireSession() {
    clearAuthToken()
    this.clearAuthToken()
    notifySessionExpired()
  }

  private setupAuthInterceptor() {
    this.apisauce.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined
        if (!originalRequest || error.response?.status !== 401) {
          return Promise.reject(error)
        }

        const url = `${originalRequest.baseURL ?? ""}${originalRequest.url ?? ""}`
        if (
          url.includes("/api/auth/login") ||
          url.includes("/api/auth/register") ||
          url.includes("/api/auth/refresh")
        ) {
          return Promise.reject(error)
        }

        if (originalRequest._retry) {
          return Promise.reject(error)
        }
        originalRequest._retry = true

        const refreshed = await this.refreshSession()
        if (!refreshed) {
          return Promise.reject(error)
        }

        const nextToken = loadAuthToken()
        if (nextToken) {
          originalRequest.headers = originalRequest.headers ?? {}
          originalRequest.headers.Authorization = `Bearer ${nextToken}`
        }
        return this.apisauce.axiosInstance(originalRequest)
      },
    )
  }

  // ---- Auth ------------------------------------------------------------------

  async register(body: RegisterBody) {
    return this.apisauce.post<{ data: AuthTokens & { farmer: AuthFarmer } }>(
      "/api/auth/register",
      body,
    )
  }

  async login(body: LoginBody) {
    return this.apisauce.post<{ data: AuthTokens & { farmer: AuthFarmer } }>(
      "/api/auth/login",
      body,
    )
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
    return this.apisauce.get<{ livestock: LivestockItem[] }>(
      "/api/catalog/livestock",
      q ? { q } : undefined,
    )
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
    return this.apisauce.post<{
      data: Pick<OnboardingData, "farmerId" | "onboardingCompletedAt" | "suggestedStep" | "steps">
    }>("/api/me/onboarding/complete")
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

  async listTemplates(params?: {
    goal?: string
    durationDays?: number
  }): Promise<{ templates: PlanTemplateDto[] }> {
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

  async startEducationCourse(activityId: string): Promise<EducationProgressDto> {
    const response = await this.apisauce.post(`/api/me/activities/${activityId}/education/start`)
    return unwrap<EducationProgressDto>(response)
  }

  async completeEducationCourse(activityId: string): Promise<EducationProgressDto> {
    const response = await this.apisauce.post(`/api/me/activities/${activityId}/education/complete`)
    return unwrap<EducationProgressDto>(response)
  }

  async rateEducationCourse(
    activityId: string,
    rating: "helpful" | "not_helpful",
  ): Promise<EducationProgressDto & { briefCleared?: boolean }> {
    const response = await this.apisauce.post(`/api/me/activities/${activityId}/education/rate`, {
      rating,
    })
    return unwrap<EducationProgressDto & { briefCleared?: boolean }>(response)
  }

  async getEducationCourses(): Promise<EducationCoursesDto> {
    const response = await this.apisauce.get("/api/me/education-courses")
    return unwrap<EducationCoursesDto>(response)
  }

  /** Mark activity done — returns raw Apisauce response for activity-detail-service. */
  async markActivityDone(activityId: string) {
    return this.apisauce.post<{ data: ActivityActionCompletionResponse }>(
      `/api/me/activities/${activityId}/done`,
    )
  }

  /** Skip activity — returns raw Apisauce response for activity-detail-service. */
  async skipActivity(activityId: string, note?: string) {
    return this.apisauce.post<{ data: ActivityActionCompletionResponse }>(
      `/api/me/activities/${activityId}/skip`,
      note ? { note } : {},
    )
  }

  /** Contest activity feedback — returns raw Apisauce response for activity-detail-service. */
  async contestActivity(activityId: string, body: { reaction: ContestReaction; note: string }) {
    return this.apisauce.post<{ data: ContestActivityResponse }>(
      `/api/me/activities/${activityId}/contest`,
      body,
    )
  }

  async getActivityQuestions(activityId: string): Promise<ActivityQuestionsListDto> {
    const response = await this.apisauce.get(`/api/me/activities/${activityId}/questions`)
    return unwrap<ActivityQuestionsListDto>(response)
  }

  async askActivityQuestion(
    activityId: string,
    question: string,
  ): Promise<AskActivityQuestionResponseDto> {
    const response = await this.apisauce.post(`/api/me/activities/${activityId}/questions`, {
      question,
    })
    return unwrap<AskActivityQuestionResponseDto>(response)
  }

  async getDayActivityQuestions(date: string): Promise<DayActivityQuestionsDto> {
    const response = await this.apisauce.get(`/api/me/days/${date}/activity-questions`)
    return unwrap<DayActivityQuestionsDto>(response)
  }

  async getDayCompletions(date: string): Promise<DayCompletionsDto> {
    const response = await this.apisauce.get(`/api/me/days/${date}/completions`)
    return unwrap<DayCompletionsDto>(response)
  }

  async submitCompletion(
    activityId: string,
    formData: FormData,
  ): Promise<{
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

  async patchPlan(
    planId: string,
    body: PatchPlanBody,
  ): Promise<{ planId: string; updated: boolean }> {
    const response = await this.apisauce.patch(`/api/me/plans/${planId}`, body)
    return unwrap<{ planId: string; updated: boolean }>(response)
  }

  // ---- Activity suggestions (AI re-queue, authenticated) ----------------------

  async listActivitySuggestions(date: string): Promise<ActivitySuggestionDto[]> {
    const response = await this.apisauce.get("/api/me/activity-suggestions", { date })
    return unwrap<ActivitySuggestionDto[]>(response)
  }

  async acceptActivitySuggestion(id: string): Promise<AcceptSuggestionResponseDto> {
    const response = await this.apisauce.post(`/api/me/activity-suggestions/${id}/accept`)
    return unwrap<AcceptSuggestionResponseDto>(response)
  }

  async dismissActivitySuggestion(id: string): Promise<void> {
    const response = await this.apisauce.post(`/api/me/activity-suggestions/${id}/dismiss`)
    unwrapVoid(response)
  }
}

export const api = new Api()
