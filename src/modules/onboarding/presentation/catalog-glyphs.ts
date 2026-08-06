import { ImageSourcePropType } from "react-native"

/**
 * Icons8 Color farm glyphs — vendored under assets/icons/farm/.
 * Free license: attribute Icons8 in Profile / About.
 */

const farm = {
  maize: require("@assets/icons/farm/maize.png"),
  beans: require("@assets/icons/farm/beans.png"),
  tomatoes: require("@assets/icons/farm/tomatoes.png"),
  kale: require("@assets/icons/farm/kale.png"),
  potatoes: require("@assets/icons/farm/potatoes.png"),
  onions: require("@assets/icons/farm/onions.png"),
  capsicum: require("@assets/icons/farm/capsicum.png"),
  watermelon: require("@assets/icons/farm/watermelon.png"),
  avocado: require("@assets/icons/farm/avocado.png"),
  mango: require("@assets/icons/farm/mango.png"),
  banana: require("@assets/icons/farm/banana.png"),
  bananas: require("@assets/icons/farm/bananas.png"),
  coffee: require("@assets/icons/farm/coffee.png"),
  tea: require("@assets/icons/farm/tea.png"),
  wheat: require("@assets/icons/farm/wheat.png"),
  rice: require("@assets/icons/farm/rice.png"),
  sugarcane: require("@assets/icons/farm/sugarcane.png"),
  sorghum: require("@assets/icons/farm/sorghum.png"),
  millet: require("@assets/icons/farm/millet.png"),
  cassava: require("@assets/icons/farm/cassava.png"),
  "sweet-potato": require("@assets/icons/farm/sweet-potato.png"),
  cabbage: require("@assets/icons/farm/cabbage.png"),
  cows: require("@assets/icons/farm/cows.png"),
  cattle: require("@assets/icons/farm/cattle.png"),
  goats: require("@assets/icons/farm/goats.png"),
  chickens: require("@assets/icons/farm/chickens.png"),
  sheep: require("@assets/icons/farm/sheep.png"),
  pigs: require("@assets/icons/farm/pigs.png"),
  rabbits: require("@assets/icons/farm/rabbits.png"),
  ducks: require("@assets/icons/farm/ducks.png"),
  bees: require("@assets/icons/farm/bees.png"),
  fish: require("@assets/icons/farm/fish.png"),
  donkeys: require("@assets/icons/farm/donkeys.png"),
  "goal-money": require("@assets/icons/farm/goal-money.png"),
  "goal-food": require("@assets/icons/farm/goal-food.png"),
  "goal-expand": require("@assets/icons/farm/goal-expand.png"),
  "goal-sustainable": require("@assets/icons/farm/goal-sustainable.png"),
  "goal-learn": require("@assets/icons/farm/goal-learn.png"),
  "goal-community": require("@assets/icons/farm/goal-community.png"),
  "goal-save-time": require("@assets/icons/farm/goal-save-time.png"),
  "goal-reduce-losses": require("@assets/icons/farm/goal-reduce-losses.png"),
  "goal-livestock-health": require("@assets/icons/farm/goal-livestock-health.png"),
  "goal-modern": require("@assets/icons/farm/goal-modern.png"),
  "farm-crops": require("@assets/icons/farm/farm-crops.png"),
  "farm-livestock": require("@assets/icons/farm/farm-livestock.png"),
  solo: require("@assets/icons/farm/solo.png"),
  team: require("@assets/icons/farm/team.png"),
  "size-small": require("@assets/icons/farm/size-small.png"),
  "size-medium": require("@assets/icons/farm/size-medium.png"),
  "size-large": require("@assets/icons/farm/size-large.png"),
  region: require("@assets/icons/farm/region.png"),
  sprout: require("@assets/icons/farm/sprout.png"),
  "empty-plan": require("@assets/icons/farm/empty-plan.png"),
  "weather-clear": require("@assets/icons/farm/weather-clear.png"),
  "weather-clouds": require("@assets/icons/farm/weather-clouds.png"),
  "weather-overcast": require("@assets/icons/farm/weather-overcast.png"),
  "weather-rain": require("@assets/icons/farm/weather-rain.png"),
  "weather-storm": require("@assets/icons/farm/weather-storm.png"),
  "weather-mist": require("@assets/icons/farm/weather-mist.png"),
  "weather-wind": require("@assets/icons/farm/weather-wind.png"),
} as const satisfies Record<string, ImageSourcePropType>

export type FarmGlyphKey = keyof typeof farm

const GOAL_SLUG_TO_KEY: Record<string, FarmGlyphKey> = {
  MAKE_MONEY: "goal-money",
  FOOD_SECURITY: "goal-food",
  EXPAND: "goal-expand",
  SUSTAINABLE: "goal-sustainable",
  LEARN: "goal-learn",
  COMMUNITY: "goal-community",
  SAVE_TIME: "goal-save-time",
  REDUCE_LOSSES: "goal-reduce-losses",
  LIVESTOCK_HEALTH: "goal-livestock-health",
  MODERN_FARMING: "goal-modern",
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-")
}

export function farmGlyph(key: string | null | undefined): ImageSourcePropType | null {
  if (!key) return null
  if (key in farm) return farm[key as FarmGlyphKey]
  const normalized = normalizeKey(key)
  if (normalized in farm) return farm[normalized as FarmGlyphKey]
  return null
}

export function cropGlyph(slugOrName: string): ImageSourcePropType {
  return farmGlyph(slugOrName) ?? farm.maize
}

export function livestockGlyph(slugOrName: string): ImageSourcePropType {
  const key = normalizeKey(slugOrName)
  if (key === "cows") return farm.cattle
  return farmGlyph(key) ?? farm.cattle
}

export function goalGlyph(slugOrIllustrationKey: string): ImageSourcePropType {
  const fromSlug = GOAL_SLUG_TO_KEY[slugOrIllustrationKey]
  if (fromSlug) return farm[fromSlug]
  return farmGlyph(slugOrIllustrationKey) ?? farm["goal-money"]
}

export function structuralGlyph(
  key:
    | "farm-crops"
    | "farm-livestock"
    | "solo"
    | "team"
    | "size-small"
    | "size-medium"
    | "size-large"
    | "region"
    | "sprout"
    | "empty-plan",
): ImageSourcePropType {
  return farm[key]
}

/**
 * Region card mark — prefer live weather when available so every county
 * isn't the same red map pin.
 */
export function regionWeatherGlyph(weather?: {
  iconCode?: string
  description?: string
} | null): ImageSourcePropType {
  const code = (weather?.iconCode ?? "").toLowerCase()
  const desc = (weather?.description ?? "").toLowerCase()

  // OpenWeatherMap icon codes: 01d clear, 02d few clouds, 03d/04d clouds,
  // 09d/10d rain, 11d thunderstorm, 13d snow, 50d mist
  if (code.startsWith("01") || desc.includes("clear") || desc.includes("sunny")) {
    return farm["weather-clear"]
  }
  if (
    code.startsWith("02") ||
    desc.includes("few clouds") ||
    desc.includes("partly") ||
    desc.includes("scattered")
  ) {
    return farm["weather-clouds"]
  }
  if (code.startsWith("03") || code.startsWith("04") || desc.includes("cloud") || desc.includes("overcast")) {
    return farm["weather-overcast"]
  }
  if (code.startsWith("09") || code.startsWith("10") || desc.includes("rain") || desc.includes("drizzle")) {
    return farm["weather-rain"]
  }
  if (code.startsWith("11") || desc.includes("thunder") || desc.includes("storm")) {
    return farm["weather-storm"]
  }
  if (code.startsWith("50") || desc.includes("mist") || desc.includes("fog") || desc.includes("haze")) {
    return farm["weather-mist"]
  }
  if (desc.includes("wind")) {
    return farm["weather-wind"]
  }

  return farm.region
}

export const ICONS8_ATTRIBUTION_URL = "https://icons8.com"
export const ICONS8_ATTRIBUTION_LABEL = "Icons by Icons8"
