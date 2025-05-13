'use client'

import { Button } from '@liam-hq/ui'
import { useState } from 'react'
import { CommentsModal } from './CommentsModal/CommentsModal'
import styles from './ReviewFeedbackComments.module.css'

interface ReviewFeedbackCommentsProps {
  reviewFeedbackId: string
}

export const ReviewFeedbackComments = ({
  reviewFeedbackId,
}: ReviewFeedbackCommentsProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  const handleCommentAdded = () => {
    // Increment the refresh trigger to cause the comment list to reload
    setRefreshTrigger((prev) => prev + 1)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.commentsTitleContainer}>
        <h3 className={styles.commentsTitle}>
          Comments{commentCount > 0 ? ` (${commentCount})` : ''}
        </h3>
        <Button size="sm" variant="outline-secondary" onClick={openModal}>
          View Comments
        </Button>
      </div>

      <CommentsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        reviewFeedbackId={reviewFeedbackId}
        refreshTrigger={refreshTrigger}
        onCommentAdded={handleCommentAdded}
        onCommentsLoaded={setCommentCount}
      />
    </div>
  )
}
