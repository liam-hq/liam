import type { FC } from 'react'
import type { ChatEntry } from '../types/chatTypes'
import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  /** The error message entry */
  message: ChatEntry
  /** Callback function to retry the failed operation */
  onRetry?: () => void
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeader}>
        <span className={styles.errorIcon}>❌</span>
        <span className={styles.errorLabel}>エラー</span>
      </div>
      <div className={styles.errorContent}>
        <p className={styles.errorText}>{message.content}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={styles.retryButton}>
            再試行
          </button>
        )}
      </div>
      {message.timestamp && (
        <div className={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  )
}