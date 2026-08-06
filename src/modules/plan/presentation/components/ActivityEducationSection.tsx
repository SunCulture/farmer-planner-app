import { useState } from "react"
import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { forest300, forest500, ink, ink2, ink3, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import type { ActivityEducation } from "../../domain/entities/activity-education"
import { hasExpandableEducation } from "../../domain/entities/activity-education"
import type { EducationProgress, EducationRating } from "../../domain/entities/education-course"
import { ActivityEducationFlashcards } from "./ActivityEducationFlashcards"
import { TipStatsSheet } from "./TipStatsSheet"

type Props = {
  activityId: string
  education?: ActivityEducation | null
  educationProgress?: EducationProgress | null
  /** Legacy plain brief when structured education is absent. */
  fallbackText?: string | null
}

export function ActivityEducationSection({
  activityId,
  education,
  educationProgress,
  fallbackText,
}: Props) {
  const [deckOpen, setDeckOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [completedLocally, setCompletedLocally] = useState(false)
  const [ratingLocally, setRatingLocally] = useState<EducationRating | null>(null)

  const serverCompleted = (educationProgress?.completedCount ?? 0) > 0
  const hasCompleted = serverCompleted || completedLocally
  const rating = ratingLocally ?? educationProgress?.lastRating ?? null

  if (education?.summary) {
    const expandable = hasExpandableEducation(education)
    return (
      <View>
        <Text style={$sectionTitle}>Why this matters</Text>
        <Text style={$summaryText}>{education.summary}</Text>

        {expandable ? (
          <>
            <View style={$actionsRow}>
              <TouchableOpacity
                style={$toggleLeft}
                onPress={() => setDeckOpen(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={hasCompleted ? $toggleTextDone : $toggleText}>
                  {hasCompleted ? "Review tips again" : "Read more"}
                </Text>
                <Ionicons
                  name="albums-outline"
                  size={16}
                  color={hasCompleted ? forest300 : forest500}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatsOpen(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={$statsLink}>View stats</Text>
              </TouchableOpacity>
            </View>

            <ActivityEducationFlashcards
              visible={deckOpen}
              activityId={activityId}
              education={education}
              rating={rating}
              hasCompleted={hasCompleted}
              serverCompletedCount={educationProgress?.completedCount ?? 0}
              onClose={() => setDeckOpen(false)}
              onCompleted={() => setCompletedLocally(true)}
              onRated={(value) => {
                setCompletedLocally(true)
                setRatingLocally(value)
              }}
            />

            <TipStatsSheet
              visible={statsOpen}
              onClose={() => setStatsOpen(false)}
              activityId={activityId}
              rating={rating}
              hasCompleted={hasCompleted}
              serverCompletedCount={educationProgress?.completedCount ?? 0}
            />
          </>
        ) : null}
      </View>
    )
  }

  const plain = fallbackText?.trim()
  return (
    <View>
      <Text style={$sectionTitle}>Why this matters</Text>
      {plain ? (
        <Text style={$summaryText}>{plain}</Text>
      ) : (
        <Text style={$emptyText}>Education for this task will appear here.</Text>
      )}
    </View>
  )
}

const $sectionTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: ink,
  marginBottom: spacing.s3,
}
const $summaryText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink2,
  lineHeight: 21,
}
const $emptyText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  lineHeight: 20,
}
const $actionsRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.s3,
  marginTop: spacing.s3,
  alignSelf: "stretch",
}
const $toggleLeft: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s1,
  flexShrink: 1,
}
const $toggleText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: forest500,
}
const $toggleTextDone: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: forest300,
}
const $statsLink: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink3,
}
