import { useEffect } from "react"
import { ActivityIndicator, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/Text"
import { markOnboardingComplete } from "@/modules/onboarding"
import { card, forest50, forest500, ink, ink3, radii, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import { useOnboardingActivation } from "../application/use-onboarding-activation"

/**
 * Renders between `POST /me/onboarding/complete` succeeding and the farmer
 * landing on their first day view. Owns the SSE wait for
 * `onboarding_activation_complete` (via `useOnboardingActivation`), the
 * 30s timeout → retry affordance, and the check-in-mode tooltip.
 */
export default function OnboardingActivationStep() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { status, payload, retry } = useOnboardingActivation()

  const navigateToPlan = () => {
    if (!payload) return
    markOnboardingComplete()
    router.replace({
      pathname: "/(tabs)/plan" as any,
      params: { date: payload.targetDate },
    })
  }

  // Auto-continue once the activation event arrives, unless it's a
  // check-in-mode plan — then we pause on a short explainer first so the
  // farmer understands why their first activity looks different.
  useEffect(() => {
    if (status === "success" && payload && !payload.checkinMode) {
      navigateToPlan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, payload])

  if (status === "timeout") {
    return (
      <View style={[$root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={$center}>
          <Ionicons name="time-outline" size={48} color={forest500} style={$statusIcon} />
          <Text style={$heading}>Something took too long.</Text>
          <Text style={$subtitle}>
            We are still building your farm plan. Tap below to check again.
          </Text>
        </View>
        <TouchableOpacity
          style={[$ctaBtn, { marginHorizontal: spacing.s5 }]}
          onPress={retry}
          activeOpacity={0.85}
        >
          <Text style={$ctaBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (status === "success" && payload?.checkinMode) {
    return (
      <View style={[$root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={$center}>
          <Ionicons
            name="checkmark-circle-outline"
            size={48}
            color={forest500}
            style={$statusIcon}
          />
          <Text style={$heading}>Your plan is ready!</Text>
          <View style={$tooltip}>
            <Text style={$tooltipText}>
              This is your intro activity — complete it to get started.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[$ctaBtn, { marginHorizontal: spacing.s5 }]}
          onPress={navigateToPlan}
          activeOpacity={0.85}
        >
          <Text style={$ctaBtnText}>View my first activity</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[$root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={$center}>
        <ActivityIndicator color={forest500} size="large" />
        <Text style={[$heading, { marginTop: spacing.s5 }]}>Setting up your farm plan...</Text>
        <Text style={$subtitle}>
          We are building your first day of activities based on what you told us.
        </Text>
      </View>
    </View>
  )
}

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: card,
}

const $center: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.s5,
}

const $statusIcon: TextStyle = {
  marginBottom: spacing.s4,
}

const $heading: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 22,
  color: ink,
  textAlign: "center",
  marginBottom: spacing.s2,
}

const $subtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  textAlign: "center",
  lineHeight: 20,
}

const $tooltip: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
  marginTop: spacing.s4,
}

const $tooltipText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: forest500,
  textAlign: "center",
  lineHeight: 20,
}

const $ctaBtn: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.pill,
  height: 52,
  alignItems: "center",
  justifyContent: "center",
}

const $ctaBtnText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
  letterSpacing: 0.2,
}
