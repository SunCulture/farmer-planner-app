import { Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { radii, spacing, statusWarn, statusWarnBg } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import type { ActivityHighlight } from "../../domain/entities/activity-highlight"

interface HighlightBadgeProps {
  highlight: ActivityHighlight
  onPress?: () => void
}

/**
 * Small banner rendered under the activity title when `activity.highlight`
 * is non-null. Tapping it scrolls to the source Q&A entry (handled by the
 * caller via `onPress`).
 */
export function HighlightBadge({ highlight, onPress }: HighlightBadgeProps) {
  return (
    <TouchableOpacity
      style={$badge}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <Ionicons name="bulb" size={16} color={statusWarn} style={$icon} />
      <Text style={$text}>{highlight.text}</Text>
    </TouchableOpacity>
  )
}

export default HighlightBadge

const $badge: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  backgroundColor: statusWarnBg,
  borderRadius: radii.lg,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s3,
  marginBottom: spacing.s4,
  gap: spacing.s2,
}

const $icon: ViewStyle = { marginTop: 1 }

const $text: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: "#5A4212",
  lineHeight: 18,
}
