import { Image, ImageSourcePropType, ImageStyle, StyleProp, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { forest50, forest100, forest500, paper2, radii } from "@/theme/tujiweze-tokens"

export type GlyphMarkSize = "sm" | "md" | "lg" | "hero"

const SIZE_PX: Record<GlyphMarkSize, { box: number; icon: number }> = {
  sm: { box: 32, icon: 20 },
  md: { box: 40, icon: 26 },
  lg: { box: 44, icon: 28 },
  hero: { box: 72, icon: 52 },
}

export interface GlyphMarkProps {
  /** Local Icons8 Color PNG (preferred). */
  source?: ImageSourcePropType | null
  /** Ionicons fallback when no source is mapped. */
  fallbackIcon?: keyof typeof Ionicons.glyphMap
  size?: GlyphMarkSize
  selected?: boolean
  style?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
}

/**
 * Circular mark for catalog choices and activity rows.
 * Color PNGs keep their own hues — selected state uses a soft wash + ring.
 */
export function GlyphMark(props: GlyphMarkProps) {
  const {
    source,
    fallbackIcon = "leaf-outline",
    size = "md",
    selected = false,
    style,
    imageStyle,
  } = props
  const dims = SIZE_PX[size]

  return (
    <View
      style={[
        $base,
        {
          width: dims.box,
          height: dims.box,
          borderRadius: dims.box / 2,
          backgroundColor: selected ? forest100 : size === "hero" ? forest50 : paper2,
          borderWidth: selected ? 1.5 : 0,
          borderColor: selected ? forest500 : "transparent",
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={[{ width: dims.icon, height: dims.icon }, imageStyle]}
          resizeMode="contain"
        />
      ) : (
        <Ionicons
          name={fallbackIcon}
          size={dims.icon * 0.85}
          color={selected ? forest500 : forest500}
        />
      )}
    </View>
  )
}

const $base: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

/** Band used on large farm-type / helpers cards. */
export function GlyphHeroBand(props: {
  source?: ImageSourcePropType | null
  fallbackIcon?: keyof typeof Ionicons.glyphMap
  backgroundColor?: string
  selected?: boolean
}) {
  const { source, fallbackIcon = "leaf-outline", backgroundColor = forest50, selected } = props
  return (
    <View style={[$heroBand, { backgroundColor }]}>
      <GlyphMark
        source={source}
        fallbackIcon={fallbackIcon}
        size="hero"
        selected={selected}
        style={$heroMark}
      />
    </View>
  )
}

const $heroBand: ViewStyle = {
  height: 110,
  alignItems: "center",
  justifyContent: "center",
}

const $heroMark: ViewStyle = {
  borderRadius: radii.xl,
  width: 88,
  height: 88,
}
