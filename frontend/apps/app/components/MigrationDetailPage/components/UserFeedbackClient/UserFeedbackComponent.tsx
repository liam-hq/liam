'use client'

import { useState } from 'react'
import styles from './UserFeedbackComponent.module.css'
import { getLangfuseWeb } from './langfuseWeb'

type UserFeedbackComponentProps = {
  traceId: string | null
}

type Feedback = 0 | 1

export const UserFeedbackComponent = ({
  traceId,
}: UserFeedbackComponentProps) => {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUserFeedback = async (value: Feedback) => {
    try {
      setIsSubmitting(true)
      const langfuseWeb = getLangfuseWeb()
      if (!langfuseWeb || !traceId) return

      await langfuseWeb.score({
        traceId,
        name: 'user_feedback',
        value,
      })
      setFeedback(value)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.feedbackContainer}>
      <span className={styles.feedbackLabel}>Was this helpful?</span>
      <div className={styles.buttonContainer}>
        <button
          type="button"
          onClick={() => handleUserFeedback(1)}
          className={`${styles.feedbackButton} ${feedback === 1 ? styles.selected : ''}`}
          disabled={isSubmitting || feedback !== null}
          aria-label="Thumbs up"
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => handleUserFeedback(0)}
          className={`${styles.feedbackButton} ${feedback === 0 ? styles.selected : ''}`}
          disabled={isSubmitting || feedback !== null}
          aria-label="Thumbs down"
        >
          👎
        </button>
      </div>
      {feedback !== null && (
        <div className={styles.thankYouMessage}>
          Thank you for your feedback!
        </div>
      )}
    </div>
  )
}
