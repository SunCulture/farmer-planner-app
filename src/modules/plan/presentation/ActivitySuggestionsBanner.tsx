import { TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { Text } from "@/components/Text"
import { forest50, forest500, radii, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import { useActivitySuggestionsSheet } from "../application/use-activity-suggestions-sheet"
import { useUnreviewedSuggestions } from "../application/use-unreviewed-suggestions"

/**
 * Persistent banner shown on Home/Plan when there are unreviewed AI
 * suggestions for today or tomorrow. Tapping it opens the shared
 * suggestions sheet against that date — this is the "revisitable" path,
 * covering the case where the SSE `activity_queue_updated` event was
 * missed (e.g. app backgrounded).
 */
export function ActivitySuggestionsBanner() {
  const { visible, date } = useUnreviewedSuggestions()
  const { open } = useActivitySuggestionsSheet()

  if (!visible || !date) return null

  return (
    <TouchableOpacity style={$banner} onPress={() => open(date)} activeOpacity={0.85}>
      <Text style={$icon}>✨</Text>
      <Text style={$text}>You have AI suggestions — tap to review</Text>
      <Ionicons name="chevron-forward" size={16} color={forest500} />
    </TouchableOpacity>
  )
}

export default ActivitySuggestionsBanner

const $banner: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  backgroundColor: forest50,
  borderRadius: radii.lg,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
  marginBottom: spacing.s4,
}
const $icon: TextStyle = { fontSize: 16 }
const $text: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: forest500,
}
