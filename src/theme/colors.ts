import {
  card, paper, paper2, hairline, ink4, ink3, ink2, ink,
  forest100, forest300, forest500, forest600,
  statusGood, statusGoodBg, statusWarn, statusWarnBg, statusBad, statusBadBg,
} from "./tapp-tokens"

const palette = {
  neutral100: card,
  neutral200: paper,
  neutral300: paper2,
  neutral400: hairline,
  neutral500: ink4,
  neutral600: ink3,
  neutral700: ink2,
  neutral800: ink,
  neutral900: "#0E0C09",

  primary100: forest100,
  primary200: forest300,
  primary300: forest300,
  primary400: forest500,
  primary500: forest500,
  primary600: forest600,

  secondary100: statusGoodBg,
  secondary200: statusGood,
  secondary300: statusWarnBg,
  secondary400: statusWarn,
  secondary500: statusBad,

  angry100: statusBadBg,
  angry500: statusBad,

  accent100: "#D8E8F5",
  accent200: "#D8E8F5",
  accent300: "#3D7AB5",
  accent400: "#3D7AB5",
  accent500: "#3D7AB5",

  overlay20: "rgba(31, 28, 24, 0.2)",
  overlay50: "rgba(31, 28, 24, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral700,
  background: palette.neutral200,
  border: palette.neutral400,
  tint: palette.primary500,
  tintInactive: palette.neutral400,
  separator: palette.neutral400,
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const
