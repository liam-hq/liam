import type { FailedOperation, TestcaseDmlExecutionResult } from './types'

function formatSqlForDisplay(sql: string, maxLength = 300): string {
  const cleanSql = sql.trim()

  if (cleanSql.length > maxLength) {
    return `${cleanSql.substring(0, maxLength)}...`
  }
  return cleanSql
}

function formatFailedOperation(failedOperation: FailedOperation): string {
  let details = `#### 1. Error: \`${failedOperation.error}\`\n`
  details += '```sql\n'
  details += formatSqlForDisplay(failedOperation.sql)
  details += '\n```'
  return details
}

export function formatValidationErrors(
  testcaseExecutionResults: TestcaseDmlExecutionResult[],
): string {
  const failedResults = testcaseExecutionResults.filter(
    (result) => !result.success,
  )

  if (failedResults.length === 0) {
    return 'Database validation complete: all checks passed successfully'
  }

  const errorCount = failedResults.length
  const errorDetails = failedResults
    .map((result) => {
      let details = `### ❌ **Test Case:** ${result.testCaseTitle}`

      if (result.failedOperation) {
        details += `\n${formatFailedOperation(result.failedOperation)}`
      }

      return details
    })
    .join('\n\n')

  return `Database validation found ${errorCount} issues. Please fix the following errors:\n\n${errorDetails}`
}
