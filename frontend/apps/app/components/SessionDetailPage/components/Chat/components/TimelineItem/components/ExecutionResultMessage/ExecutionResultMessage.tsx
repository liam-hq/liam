'use client'

import type {
  DDLExecutionResult,
  DMLExecutionResult,
} from '@liam-hq/agent/src/chat/workflow/types'
import { clsx } from 'clsx'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './ExecutionResultMessage.module.css'

type Props = {
  result: DDLExecutionResult | DMLExecutionResult
  type: 'ddl' | 'dml'
}

export const ExecutionResultMessage: FC<Props> = ({ result, type }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const isDML = type === 'dml' && 'usecase' in result
  const title = isDML ? `DML Execution: ${result.usecase}` : 'DDL Execution'

  return (
    <div className={styles.executionResult}>
      <button
        type="button"
        className={clsx(
          styles.resultHeader,
          result.success ? styles.successHeader : styles.errorHeader,
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={`${result.success ? 'Successful' : 'Failed'} ${type.toUpperCase()} execution details ${isExpanded ? 'close' : 'open'}`}
      >
        <div className={styles.statusIndicator}>
          {result.success ? '✅' : '❌'}
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.statusMessage}>
          {result.success ? 'Success' : 'Failed'}
        </div>
        <div className={styles.executionTime}>{result.executionTime}ms</div>
        <div className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</div>
      </button>

      {isExpanded && (
        <div className={styles.resultDetails}>
          <div className={styles.statementsSection}>
            <h4>Executed Statements:</h4>
            {result.statements.map((statement, index) => (
              <pre
                key={`statement-${index}-${statement.slice(0, 20)}`}
                className={styles.sqlStatement}
              >
                {statement}
              </pre>
            ))}
          </div>

          {result.results.length > 0 && (
            <div className={styles.resultsSection}>
              <h4>Execution Results:</h4>
              {result.results.map((sqlResult) => (
                <div key={sqlResult.id} className={styles.sqlResult}>
                  <div className={styles.sqlCommand}>{sqlResult.sql}</div>
                  <pre
                    className={clsx(
                      styles.resultPre,
                      !sqlResult.success && styles.error,
                    )}
                  >
                    {JSON.stringify(sqlResult.result, null, 2)}
                  </pre>
                  {sqlResult.metadata && (
                    <div className={styles.metadata}>
                      {sqlResult.metadata.executionTime !== undefined && (
                        <span>
                          Execution time: {sqlResult.metadata.executionTime}ms
                        </span>
                      )}
                      {sqlResult.metadata.affectedRows !== undefined && (
                        <span>
                          Affected rows: {sqlResult.metadata.affectedRows}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className={styles.errorsSection}>
              <h4>Errors:</h4>
              {result.errors.map((error, index) => (
                <div
                  key={`error-${index}-${error.slice(0, 20)}`}
                  className={styles.errorMessage}
                >
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
