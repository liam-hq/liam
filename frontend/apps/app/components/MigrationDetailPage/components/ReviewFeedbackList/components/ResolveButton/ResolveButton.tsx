'use client'

import { Button } from '@liam-hq/ui'
import type React from 'react'
import { useState } from 'react'
import { resolveReviewFeedback } from '../../../../actions/resolveReviewFeedback'
import { ResolutionCommentModal } from './ResolutionCommentModal'
import styles from './ResolveButton.module.css'

interface ResolveButtonProps {
  feedbackId: string
  isResolved: boolean
  resolutionComment?: string | null
  onResolve: (comment: string) => void
}

export const ResolveButton: React.FC<ResolveButtonProps> = ({
  feedbackId,
  isResolved,
  resolutionComment,
  onResolve,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleResolveClick = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleResolve = async (comment: string) => {
    setIsLoading(true)
    setError(null)

    await resolveReviewFeedback({
      feedbackId: feedbackId,
      resolutionComment: comment,
    })

    onResolve(comment)
    setIsModalOpen(false)
    setIsLoading(false)
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.buttonWrapper}>
        <Button
          size="sm"
          variant={isResolved ? 'outline-secondary' : 'solid-primary'}
          onClick={handleResolveClick}
          disabled={isLoading || isResolved}
          title={resolutionComment || ''}
        >
          {isLoading ? 'Resolving...' : isResolved ? 'Resolved' : 'Resolve'}
        </Button>
        <ResolutionCommentModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleResolve}
        />
      </div>
    </div>
  )
}
