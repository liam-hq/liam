'use client'

import { Button, XIcon } from '@liam-hq/ui'
import type { FC } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './ErrorMessage.module.css'

type ErrorMessageProps = {
  message: string
  onRetry?: () => void
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>
        <XIcon size={12} />
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.errorText}>
          <MarkdownContent content={message} />
        </div>
        {onRetry && (
          <div className={styles.retryButtonWrapper}>
            <Button
              variant="outline-overlay"
              size="sm"
              onClick={onRetry}
              className={styles.retryButton}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
