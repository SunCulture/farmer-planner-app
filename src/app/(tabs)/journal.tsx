import { View, Text, ViewStyle, TextStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { paper, ink, ink3, spacing } from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"
import { FLOATING_NAV_CLEARANCE } from "./_layout"

export default function JournalScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[$root, { paddingTop: insets.top + spacing.s4, paddingBottom: FLOATING_NAV_CLEARANCE }]}>
      <Text style={$title}>Journal</Text>
      <Text style={$subtitle}>Log your daily farm activities here.</Text>
    </View>
  )
}

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: paper,
  paddingHorizontal: spacing.s5,
}

const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 28,
  color: ink,
  marginBottom: spacing.s2,
}

const $subtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: ink3,
}
