'use client'

import { AlertTriangle, Button } from '@liam-hq/ui'
import type { FC } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './WarningMessage.module.css'

type WarningMessageProps = {
  message: string
  onAction?: () => void
  actionLabel?: string
}

export const WarningMessage: FC<WarningMessageProps> = ({
  message,
  onAction,
  actionLabel = 'Continue',
}) => {
  return (
    <div className={styles.warningContainer}>
      <div className={styles.warningIcon}>
        <AlertTriangle size={12} />
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.warningText}>
          <MarkdownContent content={message} />
        </div>
        {onAction && (
          <div className={styles.actionButtonWrapper}>
            <Button
              variant="outline-overlay"
              size="sm"
              onClick={onAction}
              className={styles.actionButton}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
