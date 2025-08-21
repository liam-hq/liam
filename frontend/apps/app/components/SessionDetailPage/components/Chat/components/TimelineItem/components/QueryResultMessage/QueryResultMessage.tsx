'use client'

import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { Button, ChevronDown, ChevronRight } from '@liam-hq/ui'
import clsx from 'clsx'
import React, { type FC, useState } from 'react'
import { QueryResultBox } from '@/components/PGlitePage/QueryResultBox'
import styles from './QueryResultMessage.module.css'

type Props = {
  queryResultId: string
  results?: SqlResult[]
  onView?: () => void
}

export const QueryResultMessage: FC<Props> = ({
  queryResultId,
  results,
  onView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!results) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.headerButton}
            disabled
            aria-label="Loading query results"
            aria-expanded={false}
          >
            <div className={styles.collapseButton}>
              <ChevronRight />
            </div>
            <span className={styles.queryResultNumber}>
              Loading query results...
            </span>
          </button>
        </div>
      </div>
    )
  }

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.length - successCount

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const getSummaryText = () => {
    if (results.length === 0) {
      return 'No results'
    }
    if (failureCount === 0) {
      return `${successCount} succeeded`
    }
    if (successCount === 0) {
      return `${failureCount} failed`
    }
    return `${successCount} succeeded, ${failureCount} failed`
  }

  return (
    <div className={clsx(styles.container, isExpanded && styles.expanded)}>
      <div className={clsx(styles.header, isExpanded && styles.expanded)}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={handleToggleExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} query results details`}
          aria-expanded={isExpanded}
          id={`query-result-header-${queryResultId}`}
        >
          <div className={styles.collapseButton}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </div>
          <span className={styles.queryResultNumber}>
            Query Results ({results.length})
          </span>
          <span className={styles.summaryText}>{getSummaryText()}</span>
        </button>
        {onView && (
          <Button
            variant="outline-secondary"
            size="xs"
            onClick={onView}
            className={styles.viewButton}
          >
            View
          </Button>
        )}
      </div>

      <div className={styles.divider} />
      <section
        className={clsx(styles.contentWrapper, isExpanded && styles.expanded)}
        aria-labelledby={`query-result-header-${queryResultId}`}
      >
        <div className={styles.content}>
          {results.map((result) => (
            <div key={result.id} className={styles.resultItem}>
              <QueryResultBox result={result} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
