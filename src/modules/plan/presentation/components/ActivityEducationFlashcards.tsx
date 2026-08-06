import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Dimensions,
  Modal,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  card,
  forest50,
  forest500,
  forest600,
  ink,
  ink2,
  ink3,
  paper,
  radii,
  spacing,
} from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import type { ActivityEducation, EducationFlashcard } from "../../domain/entities/activity-education"
import { buildEducationFlashcards } from "../../domain/entities/activity-education"
import type { EducationRating } from "../../domain/entities/education-course"
import {
  useCompleteEducationCourse,
  useRateEducationCourse,
  useStartEducationCourse,
} from "../../application/use-education-course"
import { useTipSessionActions } from "../../application/use-tip-session"
import { TipStatsSheet } from "./TipStatsSheet"

type Props = {
  visible: boolean
  activityId: string
  education: ActivityEducation
  rating?: EducationRating | null
  hasCompleted?: boolean
  serverCompletedCount?: number
  onClose: () => void
  onCompleted: () => void
  onRated?: (rating: EducationRating) => void
}

const SCREEN_WIDTH = Dimensions.get("window").width
const CARD_HORIZONTAL_PAD = spacing.s5
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PAD * 2
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25
const FLY_DISTANCE = SCREEN_WIDTH * 1.35

export function ActivityEducationFlashcards({
  visible,
  activityId,
  education,
  rating = null,
  hasCompleted = false,
  serverCompletedCount = 0,
  onClose: onCloseModal,
  onCompleted,
  onRated,
}: Props) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<"deck" | "rate">("deck")
  const [ratingBusy, setRatingBusy] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [localRating, setLocalRating] = useState<EducationRating | null>(null)

  const startCourse = useStartEducationCourse(activityId)
  const completeCourse = useCompleteEducationCourse(activityId)
  const rateCourse = useRateEducationCourse(activityId)
  const { onOpen, onProgress, onClose, onFinished } = useTipSessionActions(activityId)

  const cards = useMemo(() => buildEducationFlashcards(education), [education])
  const current = cards[index]
  const next = cards[index + 1]
  const isLast = !!current && current.kind === "done"
  const contentTotal = Math.max(cards.length - 1, 1)
  const progressLabel =
    phase === "rate" ? "Rate" : isLast ? "Done" : `${Math.min(index + 1, contentTotal)} / ${contentTotal}`

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  useEffect(() => {
    if (!visible) return
    const session = onOpen()
    const maxIndex = Math.max(cards.length - 1, 0)
    const resumeIndex = Math.min(Math.max(session.lastCardIndex, 0), maxIndex)
    const resumePhase = session.lastPhase === "rate" ? "rate" : "deck"
    setIndex(resumePhase === "rate" ? maxIndex : resumeIndex)
    setPhase(resumePhase)
    setRatingBusy(false)
    translateX.value = 0
    translateY.value = 0
    startCourse.mutate()
    // intentionally only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const finishAndClose = useCallback(() => {
    setIndex(0)
    setPhase("deck")
    translateX.value = 0
    translateY.value = 0
    onCloseModal()
  }, [onCloseModal, translateX, translateY])

  const handleFinishDeck = useCallback(async () => {
    try {
      await completeCourse.mutateAsync()
    } catch {
      // still allow rating / close
    }
    onCompleted()
    setPhase("rate")
    onProgress(index, "rate")
  }, [completeCourse, index, onCompleted, onProgress])

  const handleRate = useCallback(
    async (nextRating: EducationRating) => {
      setRatingBusy(true)
      try {
        await rateCourse.mutateAsync(nextRating)
        setLocalRating(nextRating)
        onRated?.(nextRating)
      } catch {
        // ignore — still close
      } finally {
        setRatingBusy(false)
        onFinished()
        onClose(0, "done")
        finishAndClose()
      }
    },
    [finishAndClose, onClose, onFinished, onRated, rateCourse],
  )

  const handleClose = useCallback(() => {
    onClose(index, phase === "rate" ? "rate" : "deck")
    finishAndClose()
  }, [finishAndClose, index, onClose, phase])

  const skipRate = useCallback(() => {
    onFinished()
    onClose(0, "done")
    finishAndClose()
  }, [finishAndClose, onClose, onFinished])

  const advance = useCallback(() => {
    setIndex((prev) => {
      const nextIndex = Math.min(prev + 1, cards.length - 1)
      // Defer store write so it never runs inside React's state updater / render.
      queueMicrotask(() => onProgress(nextIndex, "deck"))
      return nextIndex
    })
    translateX.value = 0
    translateY.value = 0
  }, [cards.length, onProgress, translateX, translateY])

  const discardCard = useCallback(
    (direction: 1 | -1) => {
      translateX.value = withTiming(direction * FLY_DISTANCE, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(advance)()
        }
      })
    },
    [advance, translateX],
  )

  const pan = Gesture.Pan()
    .enabled(!isLast)
    .onUpdate((e) => {
      translateX.value = e.translationX
      translateY.value = e.translationY * 0.35
    })
    .onEnd((e) => {
      const shouldDiscard =
        Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 800

      if (shouldDiscard) {
        const direction: 1 | -1 = e.translationX > 0 || e.velocityX > 0 ? 1 : -1
        translateX.value = withTiming(direction * FLY_DISTANCE, { duration: 220 }, (finished) => {
          if (finished) {
            runOnJS(advance)()
          }
        })
        translateY.value = withTiming(e.translationY * 0.4, { duration: 220 })
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 })
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 })
      }
    })

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-12, 0, 12],
      Extrapolation.CLAMP,
    )
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    }
  })

  const stampGotItStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(translateX.value), [20, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }))

  // Next card stays fully hidden at rest; only reveals as the top card is dragged away.
  const underCardStyle = useAnimatedStyle(() => {
    const drag = Math.abs(translateX.value)
    const opacity = interpolate(drag, [0, 28, SWIPE_THRESHOLD], [0, 0.35, 1], Extrapolation.CLAMP)
    const scale = interpolate(drag, [0, SWIPE_THRESHOLD], [0.96, 1], Extrapolation.CLAMP)
    return {
      opacity,
      transform: [{ scale }],
    }
  })

  if (!current && phase === "deck") return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[
            $root,
            { paddingTop: insets.top + spacing.s2, paddingBottom: insets.bottom + spacing.s4 },
          ]}
        >
          <View style={$header}>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={10}
              style={$headerBtn}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={ink} />
            </TouchableOpacity>
            <Text style={$headerTitle}>Tips</Text>
            <View style={$headerRight}>
              <TouchableOpacity
                onPress={() => setStatsOpen(true)}
                hitSlop={10}
                style={$headerBtn}
                accessibilityLabel="View tip stats"
              >
                <Ionicons name="stats-chart-outline" size={20} color={ink3} />
              </TouchableOpacity>
              <Text style={$progressText}>{progressLabel}</Text>
            </View>
          </View>

          {phase === "rate" ? (
            <View style={$ratePhase}>
              <Text style={$rateTitle}>Was this tip course helpful?</Text>
              <Text style={$rateBody}>
                Your feedback helps us improve tips for your next activities.
              </Text>
              <View style={$rateRow}>
                <TouchableOpacity
                  style={[$rateBtn, $rateBtnHelpful]}
                  onPress={() => handleRate("helpful")}
                  disabled={ratingBusy}
                  activeOpacity={0.85}
                >
                  <Ionicons name="thumbs-up" size={20} color="#FFFFFF" />
                  <Text style={$rateBtnTextLight}>Helpful</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[$rateBtn, $rateBtnNot]}
                  onPress={() => handleRate("not_helpful")}
                  disabled={ratingBusy}
                  activeOpacity={0.85}
                >
                  <Ionicons name="thumbs-down" size={20} color={ink2} />
                  <Text style={$rateBtnTextDark}>Not helpful</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={skipRate} style={$skipRate} disabled={ratingBusy}>
                <Text style={$skipRateText}>Skip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={$dotsRow}>
                {cards.map((cardItem, i) => (
                  <View
                    key={cardItem.id}
                    style={[
                      $dot,
                      i === index && $dotActive,
                      cardItem.kind === "done" && i === index && $dotDone,
                    ]}
                  />
                ))}
              </View>

              <View style={$deck}>
                {next && !isLast ? (
                  <Animated.View style={[$cardSlot, $underCard, underCardStyle]} pointerEvents="none">
                    <FlashcardFace card={next} />
                  </Animated.View>
                ) : null}

                {isLast ? (
                  <View style={$cardSlot}>
                    <FlashcardFace card={current!} />
                  </View>
                ) : (
                  <GestureDetector gesture={pan}>
                    <Animated.View style={[$cardSlot, $topCard, topCardStyle]}>
                      <FlashcardFace card={current!} />
                      <Animated.View style={[$stamp, stampGotItStyle]} pointerEvents="none">
                        <Text style={$stampText}>GOT IT</Text>
                      </Animated.View>
                    </Animated.View>
                  </GestureDetector>
                )}
              </View>

              <Text style={$swipeHint}>
                {isLast ? "You finished the tips" : "Swipe the card away when you've got it"}
              </Text>

              <View style={$footer}>
                {isLast ? (
                  <TouchableOpacity
                    style={$primaryBtn}
                    onPress={handleFinishDeck}
                    activeOpacity={0.85}
                    disabled={completeCourse.isPending}
                  >
                    <Text style={$primaryBtnText}>
                      {completeCourse.isPending ? "Saving…" : "Finish"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={$primaryBtn}
                    onPress={() => discardCard(1)}
                    activeOpacity={0.85}
                  >
                    <Text style={$primaryBtnText}>Got it</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        <TipStatsSheet
          visible={statsOpen}
          onClose={() => setStatsOpen(false)}
          activityId={activityId}
          rating={localRating ?? rating}
          hasCompleted={hasCompleted || !!localRating}
          serverCompletedCount={serverCompletedCount}
          presentation="overlay"
        />
      </GestureHandlerRootView>
    </Modal>
  )
}

function FlashcardFace({ card: item }: { card: EducationFlashcard }) {
  if (item.kind === "done") {
    return (
      <View style={[$flashCard, $doneCard]}>
        <View style={$doneIconCircle}>
          <Ionicons name="checkmark" size={36} color="#FFFFFF" />
        </View>
        <Text style={$doneTitle}>You&apos;re done</Text>
        <Text style={$doneBody}>
          You&apos;ve gone through the tips for this activity. Come back any time to review.
        </Text>
      </View>
    )
  }

  return (
    <View style={$flashCard}>
      <Text style={$cardLabel}>{item.label}</Text>
      <Text style={$cardBody}>{item.body}</Text>
    </View>
  )
}

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: paper,
}
const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  marginBottom: spacing.s3,
}
const $headerBtn: ViewStyle = {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
}
const $headerRight: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 2,
  minWidth: 72,
  justifyContent: "flex-end",
}
const $headerTitle: TextStyle = {
  flex: 1,
  textAlign: "center",
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: ink,
}
const $progressText: TextStyle = {
  minWidth: 36,
  textAlign: "right",
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink3,
}
const $dotsRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  gap: 6,
  marginBottom: spacing.s4,
  paddingHorizontal: spacing.s5,
  flexWrap: "wrap",
}
const $dot: ViewStyle = {
  width: 7,
  height: 7,
  borderRadius: 4,
  backgroundColor: "#D9D2C8",
}
const $dotActive: ViewStyle = {
  backgroundColor: forest500,
  width: 18,
}
const $dotDone: ViewStyle = {
  backgroundColor: forest600,
}
const $deck: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: CARD_HORIZONTAL_PAD,
}
const $cardSlot: ViewStyle = {
  width: CARD_WIDTH,
}
const $underCard: ViewStyle = {
  position: "absolute",
  zIndex: 0,
}
const $topCard: ViewStyle = {
  zIndex: 1,
}
const $flashCard: ViewStyle = {
  width: CARD_WIDTH,
  minHeight: 340,
  backgroundColor: card,
  borderRadius: radii.xl,
  paddingHorizontal: spacing.s6,
  paddingVertical: spacing.s8,
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "rgba(196, 185, 172, 0.55)",
}
const $doneCard: ViewStyle = {
  backgroundColor: forest50,
  alignItems: "center",
  borderColor: "rgba(42, 92, 42, 0.2)",
}
const $cardLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 13,
  color: forest500,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  marginBottom: spacing.s4,
}
const $cardBody: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 22,
  color: ink,
  lineHeight: 32,
}
const $stamp: ViewStyle = {
  position: "absolute",
  top: spacing.s6,
  right: spacing.s5,
  borderWidth: 3,
  borderColor: forest500,
  borderRadius: radii.md,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
  transform: [{ rotate: "12deg" }],
  backgroundColor: "rgba(235, 245, 235, 0.92)",
}
const $stampText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: forest500,
  letterSpacing: 1,
}
const $doneIconCircle: ViewStyle = {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: forest500,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.s5,
}
const $doneTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 24,
  color: ink,
  marginBottom: spacing.s3,
  textAlign: "center",
}
const $doneBody: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: ink2,
  lineHeight: 22,
  textAlign: "center",
}
const $swipeHint: TextStyle = {
  textAlign: "center",
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginBottom: spacing.s3,
  paddingHorizontal: spacing.s5,
}
const $footer: ViewStyle = {
  alignItems: "center",
  paddingHorizontal: spacing.s5,
}
const $primaryBtn: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.s1,
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingVertical: spacing.s3,
  paddingHorizontal: spacing.s8,
  minHeight: 48,
  minWidth: 160,
}
const $primaryBtnText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: "#FFFFFF",
}
const $ratePhase: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  paddingHorizontal: spacing.s6,
}
const $rateTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 22,
  color: ink,
  textAlign: "center",
  marginBottom: spacing.s3,
}
const $rateBody: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: ink2,
  lineHeight: 22,
  textAlign: "center",
  marginBottom: spacing.s6,
}
const $rateRow: ViewStyle = {
  flexDirection: "row",
  gap: spacing.s3,
}
const $rateBtn: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.s2,
  borderRadius: radii.pill,
  paddingVertical: spacing.s4,
  minHeight: 52,
}
const $rateBtnHelpful: ViewStyle = {
  backgroundColor: forest500,
}
const $rateBtnNot: ViewStyle = {
  backgroundColor: forest50,
  borderWidth: 1,
  borderColor: "rgba(42, 92, 42, 0.25)",
}
const $rateBtnTextLight: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: "#FFFFFF",
}
const $rateBtnTextDark: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: ink2,
}
const $skipRate: ViewStyle = {
  alignItems: "center",
  marginTop: spacing.s5,
  padding: spacing.s3,
}
const $skipRateText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: ink3,
}
