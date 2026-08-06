import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { forest50, forest500, ink, ink3, radii, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

export interface SoftEmptyStateProps {
  heading: string
  body?: string
  source?: ImageSourcePropType | null
  fallbackIcon?: keyof typeof Ionicons.glyphMap
  ctaLabel?: string
  onPressCta?: () => void
}

/**
 * Lightweight empty moment — Icons8 Color glyph + copy + optional CTA.
 * Prefer this over Ignite EmptyState (sad-face) for farming surfaces.
 */
export function SoftEmptyState(props: SoftEmptyStateProps) {
  const {
    heading,
    body,
    source,
    fallbackIcon = "leaf-outline",
    ctaLabel,
    onPressCta,
  } = props

  return (
    <View style={$root}>
      <View style={$glyphWrap}>
        {source ? (
          <Image source={source} style={$glyph} resizeMode="contain" />
        ) : (
          <Ionicons name={fallbackIcon} size={36} color={forest500} />
        )}
      </View>
      <Text style={$heading}>{heading}</Text>
      {body ? <Text style={$body}>{body}</Text> : null}
      {ctaLabel && onPressCta ? (
        <TouchableOpacity style={$cta} onPress={onPressCta} activeOpacity={0.85}>
          <Text style={$ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const $root: ViewStyle = {
  alignItems: "center",
  paddingVertical: spacing.s6,
  paddingHorizontal: spacing.s4,
}

const $glyphWrap: ViewStyle = {
  width: 72,
  height: 72,
  borderRadius: radii.xl,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.s4,
}

const $glyph: ImageStyle = {
  width: 44,
  height: 44,
}

const $heading: TextStyle = {
  fontFamily: typography.display.bold,
  fontSize: 18,
  color: ink,
  textAlign: "center",
  marginBottom: spacing.s2,
}

const $body: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  textAlign: "center",
  lineHeight: 20,
  marginBottom: spacing.s4,
}

const $cta: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s6,
  paddingVertical: spacing.s3,
  marginTop: spacing.s2,
}

const $ctaText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: "#FFFFFF",
}
