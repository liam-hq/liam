'use client'

import { clsx } from 'clsx'
import type React from 'react'
import { resolveReviewFeedback } from '../../actions/resolveReviewFeedback'
import { useReviewFeedbacks } from '../../contexts/ReviewFeedbackContext'
import { formatReviewFeedback } from '../../utils/formatReviewFeedback'
import { CopyButton } from '../CopyButton'
import styles from './ReviewFeedbackList.module.css'
import { ResolveButton } from './components/ResolveButton'
import { ReviewFeedbackComments } from './components/ReviewFeedbackComments'

interface ReviewFeedbackListProps {
  containerClassName?: string
}

export const ReviewFeedbackList: React.FC<ReviewFeedbackListProps> = ({
  containerClassName,
}) => {
  // Use the shared context instead of local state
  const { feedbacks, updateFeedback } = useReviewFeedbacks()

  const handleResolve = async (feedbackId: string, comment: string) => {
    // Call the server action to update the database
    await resolveReviewFeedback({
      feedbackId,
      resolutionComment: comment,
    })

    // Update the feedback in the shared context for immediate UI update
    updateFeedback(feedbackId, {
      resolved_at: new Date().toISOString(),
      resolution_comment: comment,
    })
  }

  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    // First sort by resolved status (unresolved first)
    if (a.resolved_at && !b.resolved_at) return 1
    if (!a.resolved_at && b.resolved_at) return -1

    // Then sort by severity
    const severityOrder = {
      CRITICAL: 0,
      WARNING: 1,
      POSITIVE: 2,
    }
    return (
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder]
    )
  })

  return (
    <div className={clsx(styles.reviewFeedbacks, containerClassName)}>
      {sortedFeedbacks.length > 0 ? (
        sortedFeedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className={clsx(
              styles.reviewFeedback,
              styles[`severity${feedback.severity}`],
              feedback.resolved_at && styles.resolved,
            )}
          >
            <div className={styles.feedbackHeader}>
              <span className={styles.feedbackCategory}>
                {feedback.category}
              </span>
              <div className={styles.feedbackActions}>
                <span className={styles.feedbackSeverity}>
                  {feedback.severity}
                </span>
                <CopyButton
                  text={formatReviewFeedback({
                    category: feedback.category,
                    severity: feedback.severity,
                    description: feedback.description || '',
                    suggestion: feedback.suggestion || '',
                    snippets:
                      feedback.review_suggestion_snippets?.map(
                        (snippet: { filename: string; snippet: string }) => ({
                          filename: snippet.filename,
                          snippet: snippet.snippet,
                        }),
                      ) || [],
                  })}
                  className={styles.feedbackCopyButton}
                />
                <ResolveButton
                  feedbackId={feedback.id}
                  isResolved={!!feedback.resolved_at}
                  resolutionComment={feedback.resolution_comment}
                  onResolve={(comment) => handleResolve(feedback.id, comment)}
                />
              </div>
            </div>
            <p className={styles.feedbackDescription}>{feedback.description}</p>
            {feedback.suggestion && (
              <div className={styles.feedbackSuggestion}>
                <h4 className={styles.suggestionTitle}>💡 Suggestion:</h4>
                <p>{feedback.suggestion}</p>
              </div>
            )}
            {feedback.review_suggestion_snippets?.map(
              (snippet: { filename: string; snippet: string; id: string }) => (
                <div key={snippet.filename} className={styles.snippetContainer}>
                  <div className={styles.snippetHeader}>
                    <span className={styles.fileIcon}>📄</span>
                    <span className={styles.fileName}>{snippet.filename}</span>
                  </div>
                  <div className={styles.codeContainer}>
                    <pre className={styles.codeSnippet}>{snippet.snippet}</pre>
                  </div>
                </div>
              ),
            )}
            {feedback.resolved_at && (
              <div className={styles.resolvedInfo}>
                <span className={styles.resolvedIcon}>✓</span>
                <span className={styles.resolvedText}>
                  Resolved on{' '}
                  {new Date(feedback.resolved_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    hour12: false,
                  })}
                </span>
                {feedback.resolution_comment && (
                  <div className={styles.resolutionComment}>
                    <p className={styles.resolutionCommentTitle}>
                      Resolution Comment:
                    </p>
                    <p className={styles.resolutionCommentText}>
                      {feedback.resolution_comment}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Comments section for this feedback */}
            <ReviewFeedbackComments reviewFeedbackId={feedback.id} />
          </div>
        ))
      ) : (
        <p className={styles.noFeedbacks}>No review feedbacks found.</p>
      )}
    </div>
  )
}
