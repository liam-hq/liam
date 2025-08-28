import type { FailedOperation, TestcaseDmlExecutionResult } from './types'

function formatSqlForDisplay(sql: string, maxLength = 300): string {
  const cleanSql = sql.trim()

  if (cleanSql.length > maxLength) {
    return `${cleanSql.substring(0, maxLength)}...`
  }
  return cleanSql
}

function formatFailedOperations(failedOperations: FailedOperation[]): string {
  return failedOperations
    .map((op, index) => {
      let details = `#### ${index + 1}. Error: \`${op.error}\`\n`
      details += '```sql\n'
      details += formatSqlForDisplay(op.sql)
      details += '\n```'
      return details
    })
    .join('\n\n')
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

      if (result.failedOperations && result.failedOperations.length > 0) {
        details += `\n${formatFailedOperations(result.failedOperations)}`
      }

      return details
    })
    .join('\n\n')

  return `Database validation found ${errorCount} issues. Please fix the following errors:\n\n${errorDetails}`
}
