'use client'

import { useReviewFeedbacks } from '../../contexts/ReviewFeedbackContext'
import { calculateScoresFromIssues } from '../../utils/calculateScores'
import { RadarChart } from '../RadarChart/RadarChart'
import styles from './MigrationHealthClient.module.css'

type MigrationHealthClientProps = {
  className?: string
}

export const MigrationHealthClient = ({
  className,
}: MigrationHealthClientProps) => {
  // Use the shared context instead of local state
  const { feedbacks } = useReviewFeedbacks()

  // Calculate scores from feedbacks
  const scores = calculateScoresFromIssues(feedbacks)

  return (
    <div className={className}>
      {feedbacks && feedbacks.length > 0 ? (
        <div className={styles.radarChartContainer}>
          <RadarChart scores={scores} />
        </div>
      ) : (
        <p className={styles.noScores}>No review feedbacks found.</p>
      )}
    </div>
  )
}
