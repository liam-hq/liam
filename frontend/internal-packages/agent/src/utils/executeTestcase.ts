import type { DmlOperation } from '@liam-hq/artifact'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { Testcase } from '../qa-agent/types'
import type { TestcaseDmlExecutionResult } from '../qa-agent/validateSchema/types'

function isErrorResult(value: unknown): value is { error: unknown } {
  return typeof value === 'object' && value !== null && 'error' in value
}

/**
 * Build combined SQL for DDL and testcase DML
 */
function buildCombinedSql(ddlStatements: string, testcase: Testcase): string {
  const sqlParts = []

  if (ddlStatements.trim()) {
    sqlParts.push('-- DDL Statements', ddlStatements, '')
  }

  const op: DmlOperation = testcase.dmlOperation
  const header = op.description
    ? `-- ${op.description}`
    : `-- ${op.operation_type} operation`
  sqlParts.push(
    `-- Test Case: ${testcase.id}`,
    `-- ${testcase.title}`,
    `${header}\n${op.sql};`,
  )

  return sqlParts.filter(Boolean).join('\n')
}

/**
 * Extract failed operation from SQL results
 */
function extractFailedOperation(
  sqlResults: SqlResult[],
): { sql: string; error: string } | undefined {
  const firstFailed = sqlResults.find((r) => !r.success)
  if (!firstFailed) {
    return undefined
  }

  const error = isErrorResult(firstFailed.result)
    ? String(firstFailed.result.error)
    : String(firstFailed.result)

  return { sql: firstFailed.sql, error }
}

/**
 * Execute a single testcase with DDL statements
 */
export async function executeTestcase(
  ddlStatements: string,
  testcase: Testcase,
  requiredExtensions: string[],
): Promise<TestcaseDmlExecutionResult> {
  const combinedSql = buildCombinedSql(ddlStatements, testcase)
  const startTime = new Date()

  const sqlResults = await executeQuery(combinedSql, requiredExtensions)
  const hasErrors = sqlResults.some((result) => !result.success)
  const failedOperation = hasErrors
    ? extractFailedOperation(sqlResults)
    : undefined

  const baseResult = {
    testCaseId: testcase.id,
    testCaseTitle: testcase.title,
    executedAt: startTime,
  }

  if (hasErrors && failedOperation) {
    return {
      ...baseResult,
      success: false,
      failedOperation,
    }
  }

  return {
    ...baseResult,
    success: true,
  }
}
