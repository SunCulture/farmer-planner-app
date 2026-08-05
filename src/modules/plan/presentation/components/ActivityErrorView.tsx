import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

import { forest500, ink, radii, spacing, statusBad } from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

import { getActivityErrorMessage } from "../../application/activity-errors"

type Props = {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function ActivityErrorView({ error, onRetry, title = "Something went wrong" }: Props) {
  return (
    <View style={$box}>
      <Text style={$title}>{title}</Text>
      <Text style={$message}>{getActivityErrorMessage(error)}</Text>
      {onRetry ? (
        <TouchableOpacity style={$retry} onPress={onRetry} activeOpacity={0.85}>
          <Text style={$retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const $box: ViewStyle = {
  alignItems: "center",
  padding: spacing.s5,
  gap: spacing.s2,
}
const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: ink,
  textAlign: "center",
}
const $message: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: statusBad,
  textAlign: "center",
  marginBottom: spacing.s2,
}
const $retry: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.lg,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
}
const $retryText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  color: "#FFF",
  fontSize: 14,
}
