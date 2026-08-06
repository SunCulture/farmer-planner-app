import { ImageSourcePropType } from "react-native"

/**
 * Maps API activity `iconKey` values to vendored Icons8 Color PNGs.
 * Unknown keys fall back to the generic task glyph.
 */

const activityIcons = {
  water: require("@assets/icons/farm/water.png"),
  irrigation: require("@assets/icons/farm/irrigation.png"),
  "pest-scout": require("@assets/icons/farm/pest-scout.png"),
  "field-work": require("@assets/icons/farm/field-work.png"),
  money: require("@assets/icons/farm/money.png"),
  market: require("@assets/icons/farm/market.png"),
  calendar: require("@assets/icons/farm/calendar.png"),
  eye: require("@assets/icons/farm/eye.png"),
  storage: require("@assets/icons/farm/storage.png"),
  task: require("@assets/icons/farm/task.png"),
  fertilizer: require("@assets/icons/farm/fertilizer.png"),
  planting: require("@assets/icons/farm/planting.png"),
  harvest: require("@assets/icons/farm/harvest.png"),
  soil: require("@assets/icons/farm/soil.png"),
  weather: require("@assets/icons/farm/weather.png"),
  tractor: require("@assets/icons/farm/tractor.png"),
} as const satisfies Record<string, ImageSourcePropType>

const emptyIcons = {
  plan: require("@assets/icons/farm/empty-plan.png"),
  journal: require("@assets/icons/farm/empty-plan.png"),
  sprout: require("@assets/icons/farm/sprout.png"),
} as const

export type ActivityIconKey = keyof typeof activityIcons

/** @deprecated Prefer iconKeyToGlyph — emoji icons were removed. */
export function iconKeyToEmoji(_iconKey: string): string {
  return ""
}

export function iconKeyToGlyph(iconKey: string | null | undefined): ImageSourcePropType {
  if (!iconKey) return activityIcons.task
  const key = iconKey.trim().toLowerCase()
  if (key in activityIcons) return activityIcons[key as ActivityIconKey]
  const aliases: Record<string, ActivityIconKey> = {
    watering: "irrigation",
    irrigate: "irrigation",
    pest: "pest-scout",
    scout: "pest-scout",
    field: "field-work",
    finance: "money",
    observation: "eye",
    "post-harvest": "storage",
    planning: "calendar",
    protect: "pest-scout",
    protection: "pest-scout",
  }
  const aliased = aliases[key]
  if (aliased) return activityIcons[aliased]
  return activityIcons.task
}

export function emptyStateGlyph(kind: keyof typeof emptyIcons): ImageSourcePropType {
  return emptyIcons[kind]
}
