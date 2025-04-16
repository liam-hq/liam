'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CommentWithUser } from '../../../actions/reviewFeedbackComments'
import { getReviewFeedbackComments } from '../../../actions/reviewFeedbackComments'
import styles from './CommentList.module.css'

interface CommentListProps {
  reviewFeedbackId: number
  refreshTrigger: number
  onCommentsLoaded?: (count: number) => void
}

export const CommentList = ({
  reviewFeedbackId,
  refreshTrigger,
  onCommentsLoaded,
}: CommentListProps) => {
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Define fetchComments as a memoized callback
  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fetchedComments = await getReviewFeedbackComments({
        feedbackId: reviewFeedbackId,
      })
      setComments(fetchedComments)

      if (onCommentsLoaded) {
        onCommentsLoaded(fetchedComments.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
      console.error('Error fetching comments:', err)

      if (onCommentsLoaded) {
        onCommentsLoaded(0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [reviewFeedbackId, onCommentsLoaded])

  // Fetch comments on mount and when reviewFeedbackId changes
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Fetch comments when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchComments()
    }
  }, [refreshTrigger, fetchComments])

  if (isLoading) {
    return <div className={styles.loading}>Loading comments...</div>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  if (comments.length === 0) {
    return <div className={styles.noComments}>No comments yet</div>
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => (
        <div key={comment.id} className={styles.commentItem}>
          <div className={styles.commentHeader}>
            <div className={styles.commentAuthor}>
              <span>👤 {comment.user.name}</span>
            </div>
            <div className={styles.commentDate}>
              {new Date(comment.created_at).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                hour12: false,
              })}
            </div>
          </div>
          <div className={styles.commentContent}>{comment.content}</div>
        </div>
      ))}
    </div>
  )
}
