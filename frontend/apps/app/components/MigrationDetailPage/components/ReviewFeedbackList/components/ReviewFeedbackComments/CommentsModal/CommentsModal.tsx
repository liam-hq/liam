'use client'

import { Button, XIcon } from '@liam-hq/ui'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { CommentForm } from '../CommentForm/CommentForm'
import { CommentList } from '../CommentList/CommentList'
import styles from './CommentsModal.module.css'

interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  reviewFeedbackId: string
  refreshTrigger: number
  onCommentAdded: () => void
  onCommentsLoaded?: (count: number) => void
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  reviewFeedbackId,
  refreshTrigger,
  onCommentAdded,
  onCommentsLoaded,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [commentCount, setCommentCount] = useState(0)

  const handleCommentsLoaded = (count: number) => {
    setCommentCount(count)
    if (onCommentsLoaded) {
      onCommentsLoaded(count)
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        e.target instanceof Node &&
        !modalRef.current.contains(e.target) &&
        isOpen
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Comments{' '}
            {commentCount > 0 ? (
              <span className={styles.commentCount}>({commentCount})</span>
            ) : (
              ''
            )}
          </h3>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close comments modal"
          >
            <XIcon className={styles.closeIcon} />
          </Button>
        </div>

        <div className={styles.modalBody}>
          <CommentList
            reviewFeedbackId={reviewFeedbackId}
            refreshTrigger={refreshTrigger}
            onCommentsLoaded={handleCommentsLoaded}
          />

          <div className={styles.formSection}>
            <h4 className={styles.formTitle}>Add a comment</h4>
            <CommentForm
              reviewFeedbackId={reviewFeedbackId}
              onCommentAdded={onCommentAdded}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
