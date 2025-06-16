'use client'

import { useState } from 'react'
import styles from './QueryResultBox.module.css'
import type { SqlResult } from './utils'

export const QueryResultBox = ({ result }: { result: SqlResult }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={styles.queryResultBox}>
      {/* Status header - always visible */}
      <button
        type="button"
        className={`${styles.resultHeader} ${result.success ? styles.successHeader : styles.errorHeader}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={`${result.success ? 'Successful' : 'Failed'} query details ${isExpanded ? 'close' : 'open'}`}
      >
        <div className={styles.statusIndicator}>
          {result.success ? '✅' : '❌'}
        </div>
        <div className={styles.sqlPreview}>
          {result.sql.length > 50
            ? `${result.sql.substring(0, 50)}...`
            : result.sql}
        </div>
        <div className={styles.statusMessage}>
          {result.success ? 'Success' : 'Failed'}
        </div>
        <div className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</div>
      </button>

      {/* Detailed information - displayed only when expanded */}
      {isExpanded && (
        <div className={styles.resultDetails}>
          <div className={styles.sqlCommand}>{result.sql}</div>
          <pre
            className={`${styles.resultPre} ${result.success ? '' : styles.error}`}
          >
            {JSON.stringify(result.result, null, 2)}
          </pre>
          {/* Metadata display area for future extensions */}
          {result.metadata && (
            <div className={styles.metadataContainer}>
              {result.metadata.executionTime !== undefined && (
                <div>Execution time: {result.metadata.executionTime}ms</div>
              )}
              {result.metadata.affectedRows !== undefined && (
                <div>Affected rows: {result.metadata.affectedRows}</div>
              )}
              {result.metadata.timestamp && (
                <div>Execution timestamp: {result.metadata.timestamp}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
