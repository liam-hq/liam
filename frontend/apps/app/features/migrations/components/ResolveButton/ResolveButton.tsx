'use client'

import { Button } from '@liam-hq/ui'
import type React from 'react'
import { useState } from 'react'
import { resolveReviewFeedback } from '../../actions/resolveReviewFeedback'
import { ResolutionCommentModal } from '../ResolutionCommentModal/ResolutionCommentModal'
import styles from './ResolveButton.module.css'

interface ResolveButtonProps {
  issueId: number
  isResolved: boolean
  resolutionComment?: string | null
  onResolve: (comment: string) => void
}

export const ResolveButton: React.FC<ResolveButtonProps> = ({
  issueId,
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
    try {
      setIsLoading(true)
      setError(null)

      try {
        await resolveReviewFeedback({
          feedbackId: issueId,
          resolutionComment: comment,
        })

        onResolve(comment)
        setIsModalOpen(false)
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Failed to resolve feedback')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error resolving feedback:', err)
    } finally {
      setIsLoading(false)
    }
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
