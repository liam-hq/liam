'use client'

import { Button } from '@liam-hq/ui'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import styles from './ResolutionCommentModal.module.css'

interface ResolutionCommentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (comment: string) => void
}

export const ResolutionCommentModal: React.FC<ResolutionCommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

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

  const handleSubmit = () => {
    if (!comment.trim()) return

    setIsSubmitting(true)
    onSubmit(comment)
    setIsSubmitting(false)
    setComment('')
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Resolution Comment</h3>
          <p className={styles.modalDescription}>
            Please provide a comment about how this issue was resolved.
          </p>
        </div>

        <div className={styles.formGroup}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your resolution comment..."
            className={styles.textarea}
            rows={5}
          />
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.buttonGroup}>
            <Button
              variant="outline-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="solid-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit and Resolve'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
