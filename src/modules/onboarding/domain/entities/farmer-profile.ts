export type FarmType = "crops" | "livestock"
export type WorkStyle = "solo" | "helpers"
export type FarmSize = "small" | "medium" | "large"

export interface FarmerProfile {
  name: string
  location: string
  farmType: FarmType
  crops: string[]
  livestock: string[]
  workStyle: WorkStyle
  farmSize: FarmSize
  goals: string[]
}
