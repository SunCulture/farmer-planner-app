const ICON_KEY_EMOJI: Record<string, string> = {
  "pest-scout": "🔍",
  field: "🌾",
  finance: "💰",
  market: "🏪",
  irrigation: "💧",
  protection: "🛡️",
  planning: "📋",
  "post-harvest": "📦",
  observation: "👁️",
}

export function iconKeyToEmoji(iconKey: string): string {
  return ICON_KEY_EMOJI[iconKey] ?? "🌱"
}
