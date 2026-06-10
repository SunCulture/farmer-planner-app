export type ProductionType = "CROPS" | "LIVESTOCK" | "MIXED"
export type HelpersLevel = "SOLO" | "WITH_HELPERS"

export interface FarmerLocation {
  label: string
  county?: string
  country?: string
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
}
