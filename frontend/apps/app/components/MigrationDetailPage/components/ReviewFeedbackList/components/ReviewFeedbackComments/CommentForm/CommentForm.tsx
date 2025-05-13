'use client'

import { Button } from '@liam-hq/ui'
import type { FormEvent } from 'react'
import { useState } from 'react'
import styles from './CommentForm.module.css'
import { addReviewFeedbackComment } from './actions/addReviewFeedbackComment'

interface CommentFormProps {
  reviewFeedbackId: string
  onCommentAdded: () => void
}

export const CommentForm = ({
  reviewFeedbackId,
  onCommentAdded,
}: CommentFormProps) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setIsSubmitting(true)
    setError(null)

    await addReviewFeedbackComment({
      feedbackId: reviewFeedbackId,
      content: content.trim(),
    })

    setContent('')
    onCommentAdded()
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <div className={styles.textareaWrapper}>
        <textarea
          className={styles.commentTextarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add your comment here..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formActions}>
        <Button
          type="submit"
          size="sm"
          variant="solid-primary"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </Button>
      </div>
    </form>
  )
}
