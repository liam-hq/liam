'use client'

import type { CategoryEnum } from '../components/RadarChart/RadarChart'

type ReviewFeedbackForScore = {
  category: string
  severity: string
  resolvedAt?: string | null
}

type CalculatedScore = {
  id: string
  overallReviewId: string
  overallScore: number
  category: CategoryEnum
}

/**
 * Calculates scores from review feedbacks, excluding resolved feedbacks
 */
export const calculateScoresFromIssues = (
  feedbacks: ReviewFeedbackForScore[],
): CalculatedScore[] => {
  // Group feedbacks by category
  const feedbacksByCategory = feedbacks.reduce<
    Record<string, Array<{ severity: string; resolvedAt?: string | null }>>
  >((acc, feedback) => {
    if (!acc[feedback.category]) {
      acc[feedback.category] = []
    }
    acc[feedback.category].push({
      severity: feedback.severity,
      resolvedAt: feedback.resolvedAt,
    })
    return acc
  }, {})

  // Calculate scores for each category
  return Object.entries(feedbacksByCategory).map(
    ([category, categoryFeedbacks]) => {
      // Start with 10 points
      let score = 10

      // Calculate deductions based on feedback severity (only for unresolved feedbacks)
      for (const feedback of categoryFeedbacks) {
        if (feedback.resolvedAt) continue // Skip resolved feedbacks

        if (feedback.severity === 'CRITICAL') {
          score -= 3
        } else if (feedback.severity === 'WARNING') {
          score -= 1
        }
        // No deduction for POSITIVE or QUESTION feedback
      }

      // Ensure minimum score is 0
      score = Math.max(0, score)

      return {
        id: category, // Use category as ID
        overallReviewId: '', // Not needed anymore
        overallScore: score,
        category: category as CategoryEnum,
      }
    },
  )
}
