'use client'

import clsx from 'clsx'
import { useState } from 'react'
import styles from './QueryResultAccordion.module.css'
import type { SqlResult } from './utils'

export const QueryResultAccordion = ({ result }: { result: SqlResult }) => {
  const [isQueryExpanded, setIsQueryExpanded] = useState(false)
  const [isResultExpanded, setIsResultExpanded] = useState(false)

  return (
    <div className={styles.accordionContainer}>
      <div
        className={clsx(
          styles.statusBadge,
          result.success ? styles.success : styles.error,
        )}
      >
        {result.success ? 'Success' : 'Failed'}
      </div>

      {/* Query Section */}
      <div className={styles.accordionSection}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          aria-expanded={isQueryExpanded}
          aria-label="Toggle query"
        >
          <span className={styles.accordionTitle}>Query</span>
          <span className={styles.accordionIcon}>
            {isQueryExpanded ? '▼' : '▶'}
          </span>
        </button>
        {isQueryExpanded && (
          <div className={styles.accordionContent}>
            <pre className={styles.queryContent}>{result.sql}</pre>
          </div>
        )}
      </div>

      {/* Result Section */}
      <div className={styles.accordionSection}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setIsResultExpanded(!isResultExpanded)}
          aria-expanded={isResultExpanded}
          aria-label="Toggle result"
        >
          <span className={styles.accordionTitle}>Result</span>
          <span className={styles.accordionIcon}>
            {isResultExpanded ? '▼' : '▶'}
          </span>
        </button>
        {isResultExpanded && (
          <div className={styles.accordionContent}>
            <pre className={styles.resultContent}>
              {JSON.stringify(result.result, null, 2)}
            </pre>
            {result.metadata && (
              <div className={styles.metadata}>
                {result.metadata.executionTime !== undefined && (
                  <div>Execution time: {result.metadata.executionTime}ms</div>
                )}
                {result.metadata.affectedRows !== undefined && (
                  <div>Affected rows: {result.metadata.affectedRows}</div>
                )}
                {result.metadata.timestamp && (
                  <div>{result.metadata.timestamp}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
