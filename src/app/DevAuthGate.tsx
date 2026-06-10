import React from "react"
import { Text, TextStyle, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { hasDevAuthToken } from "@/bootstrap/dev-auth"
import { ink, ink3, spacing } from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

export function DevAuthGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()

  if (!__DEV__ || hasDevAuthToken()) {
    return <>{children}</>
  }

  return (
    <View style={[$root, { paddingTop: insets.top + spacing.s6 }]}>
      <Text style={$title}>Dev token required</Text>
      <Text style={$body}>
        Set EXPO_PUBLIC_DEV_ACCESS_TOKEN in your .env file. Register or log in via Postman, then paste
        the accessToken from the response.
      </Text>
    </View>
  )
}

const $root: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.s5,
  justifyContent: "center",
}

const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 20,
  color: ink,
  marginBottom: spacing.s3,
}

const $body: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  lineHeight: 21,
}
