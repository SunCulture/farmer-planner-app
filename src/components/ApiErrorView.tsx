import React from "react"
import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

import { getApiErrorMessage } from "@/shared/infrastructure/api-error"
import { forest500, ink, ink3, radii, spacing } from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

interface ApiErrorViewProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function ApiErrorView({ error, onRetry, title = "Could not load data" }: ApiErrorViewProps) {
  return (
    <View style={$container}>
      <Text style={$title}>{title}</Text>
      <Text style={$message}>{getApiErrorMessage(error)}</Text>
      {onRetry ? (
        <TouchableOpacity style={$retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={$retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const $container: ViewStyle = {
  padding: spacing.s5,
  alignItems: "center",
}

const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: ink,
  marginBottom: spacing.s2,
  textAlign: "center",
}

const $message: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  textAlign: "center",
  lineHeight: 18,
  marginBottom: spacing.s4,
}

const $retryBtn: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s5,
  paddingVertical: spacing.s3,
}

const $retryText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: "#FFFFFF",
}
