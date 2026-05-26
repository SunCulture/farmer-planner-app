import { Platform, Pressable, Text, View, ViewStyle, TextStyle } from "react-native"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { card, forest500, hairline, ink3, spacing } from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

export const FLOATING_NAV_HEIGHT = 60
export const FLOATING_NAV_BOTTOM_GAP = 8
export const FLOATING_NAV_CLEARANCE = FLOATING_NAV_HEIGHT + FLOATING_NAV_BOTTOM_GAP + 20

type TabDef = {
  name: string
  label: string
  icon: React.ComponentProps<typeof Ionicons>["name"]
  iconFocused: React.ComponentProps<typeof Ionicons>["name"]
}

const TABS: TabDef[] = [
  { name: "index", label: "Home", icon: "home-outline", iconFocused: "home" },
  { name: "plan", label: "Plan", icon: "calendar-outline", iconFocused: "calendar" },
  { name: "journal", label: "Journal", icon: "journal-outline", iconFocused: "journal" },
]

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      pointerEvents="box-none"
      style={[$outerWrap, { bottom: insets.bottom + FLOATING_NAV_BOTTOM_GAP }]}
    >
      <View style={$pill}>
        {TABS.map((tab, i) => {
          const focused = state.index === i
          return (
            <Pressable
              key={tab.name}
              style={$tabItem}
              onPress={() => navigation.navigate(tab.name)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              hitSlop={6}
            >
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={22}
                color={focused ? forest500 : ink3}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="journal" />
    </Tabs>
  )
}

const $outerWrap: ViewStyle = {
  position: "absolute",
  left: spacing.s4,
  right: spacing.s4,
  alignItems: "stretch",
  pointerEvents: "box-none",
}

const $pill: ViewStyle = {
  flexDirection: "row",
  backgroundColor: card,
  borderRadius: 28,
  borderWidth: 1,
  borderColor: hairline,
  height: FLOATING_NAV_HEIGHT,
  overflow: "hidden",
  shadowColor: "#1F1C18",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 20,
  elevation: 14,
}

const $tabItem: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
}

const styles = {
  label: {
    fontFamily: typography.primary.normal,
    fontSize: 11,
    letterSpacing: 0.2,
    color: ink3,
  } as TextStyle,
  labelActive: {
    color: forest500,
    fontFamily: typography.primary.medium,
  } as TextStyle,
}
