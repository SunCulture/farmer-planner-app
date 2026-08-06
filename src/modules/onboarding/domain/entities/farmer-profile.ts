export type ProductionType = "CROPS" | "LIVESTOCK" | "MIXED"
export type HelpersLevel = "SOLO" | "SMALL_TEAM" | "LARGE_TEAM"

export interface FarmerLocation {
  label: string
  county?: string
  country?: string
  soilType?: string
  farmingStage?: string
  weatherSummary?: string
  soilCondition?: string
  waterAvailability?: string
  diseasesReported?: string[]
}

export interface FarmerProfile {
  name: string
  location: FarmerLocation
  productionType: ProductionType
  cropIds: string[]
  livestockIds: string[]
  helpersLevel: HelpersLevel
  acreage: number
  goalSlugs: string[]
  /** Free-text farmer goal for the next 2 weeks, captured at the end of onboarding. */
  twoWeekGoal?: string
}
