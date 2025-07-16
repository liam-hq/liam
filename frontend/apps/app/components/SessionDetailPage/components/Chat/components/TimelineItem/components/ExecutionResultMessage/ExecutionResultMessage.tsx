'use client'

import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './ExecutionResultMessage.module.css'

type Props = {
  result: {
    content: string
  }
  type: 'ddl' | 'dml'
}

export const ExecutionResultMessage: FC<Props> = ({ result, type }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  let parsedResult: {
    statements: string[]
    results: SqlResult[]
    executionTime: number
    success: boolean
    errors?: string[]
    usecase?: string
  }

  try {
    parsedResult = JSON.parse(result.content)
  } catch {
    return <div>Error parsing execution result</div>
  }

  if (!parsedResult || typeof parsedResult !== 'object') {
    return <div>Invalid execution result format</div>
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExpanded()
    }
  }

  const formatExecutionTime = (time: number) => {
    if (time < 1000) {
      return `${time}ms`
    }
    return `${(time / 1000).toFixed(2)}s`
  }

  const getStatusText = () => {
    if (parsedResult.success) {
      return type === 'ddl'
        ? 'DDL executed successfully'
        : 'DML executed successfully'
    }
    return type === 'ddl' ? 'DDL execution failed' : 'DML execution failed'
  }

  const getStatusIcon = () => {
    return parsedResult.success ? '✅' : '❌'
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.header}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${getStatusText()}, click to ${isExpanded ? 'collapse' : 'expand'} details`}
      >
        <div className={styles.statusInfo}>
          <span className={styles.statusIcon}>{getStatusIcon()}</span>
          <span className={styles.statusText}>{getStatusText()}</span>
          {parsedResult.usecase && (
            <span className={styles.usecase}>({parsedResult.usecase})</span>
          )}
        </div>
        <div className={styles.metadata}>
          <span className={styles.executionTime}>
            {formatExecutionTime(parsedResult.executionTime)}
          </span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className={styles.details}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Executed Statements</h4>
            <div className={styles.codeBlock}>
              <pre className={styles.code}>
                {parsedResult.statements.join(';\n\n')}
              </pre>
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Execution Results</h4>
            <div className={styles.resultsContainer}>
              {parsedResult.results.map((sqlResult, index: number) => (
                <div key={sqlResult.id || index} className={styles.resultItem}>
                  <div className={styles.resultHeader}>
                    <span className={styles.resultStatus}>
                      {sqlResult.success ? '✅' : '❌'}
                    </span>
                    <span className={styles.resultSql}>{sqlResult.sql}</span>
                  </div>
                  <div className={styles.resultContent}>
                    <pre className={styles.resultData}>
                      {JSON.stringify(sqlResult.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {parsedResult.errors && parsedResult.errors.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Errors</h4>
              <div className={styles.errorContainer}>
                {parsedResult.errors.map((error: string, index: number) => (
                  <div
                    key={`error-${error.slice(0, 50)}-${index}`}
                    className={styles.errorItem}
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
