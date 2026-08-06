import type { OnboardingData } from "@/services/api"

import type { FarmerProfile } from "../domain/entities/farmer-profile"

/** UI step indices in OnboardingScreen (0 = auth). */
export function uiStepFromSuggested(suggestedStep: string | null | undefined): number {
  switch (suggestedStep) {
    case "name":
      return 1
    case "location":
      return 2
    case "production_type":
      return 3
    case "crops":
    case "livestock":
      return 4
    case "helpers":
      return 5
    case "acreage":
      return 6
    case "goals":
      return 7
    case "review":
      return 8
    default:
      return 1
  }
}

export type OnboardingDraftSnapshot = {
  name: string
  location: string
  locationSlug: string
  farmType: "crops" | "livestock" | null
  crops: string[]
  livestock: string[]
  workStyle: "solo" | "helpers" | null
  farmSize: "small" | "medium" | "large" | null
  goals: string[]
  twoWeekGoal: string
}

function farmSizeFromAcreage(acreage: number | null): OnboardingDraftSnapshot["farmSize"] {
  if (acreage === null) return null
  if (acreage <= 1) return "small"
  if (acreage <= 4) return "medium"
  return "large"
}

export function draftFromOnboardingData(data: OnboardingData): OnboardingDraftSnapshot {
  const farmType =
    data.productionType === "LIVESTOCK"
      ? "livestock"
      : data.productionType === "CROPS" || data.productionType === "MIXED"
        ? "crops"
        : null

  return {
    name: data.name ?? "",
    location: data.location?.label ?? "",
    locationSlug: data.location?.county ?? "",
    farmType,
    crops: data.cropIds ?? [],
    livestock: data.livestockIds ?? [],
    workStyle:
      data.helpersLevel === "SOLO" ? "solo" : data.helpersLevel != null ? "helpers" : null,
    farmSize: farmSizeFromAcreage(data.acreage),
    goals: data.goalSlugs ?? [],
    twoWeekGoal: data.twoWeekGoal ?? "",
  }
}

export function profileFromOnboardingData(data: OnboardingData): FarmerProfile {
  return {
    name: data.name,
    location: data.location ?? { label: "", county: "", country: "" },
    productionType: data.productionType ?? "CROPS",
    cropIds: data.cropIds,
    livestockIds: data.livestockIds,
    helpersLevel: data.helpersLevel ?? "SOLO",
    acreage: data.acreage ?? 1,
    goalSlugs: data.goalSlugs,
    twoWeekGoal: data.twoWeekGoal ?? undefined,
  }
}
