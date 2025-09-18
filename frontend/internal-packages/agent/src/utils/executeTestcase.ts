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
 * @param signal - Optional AbortSignal for cancellation
 */
export async function executeTestcase(
  ddlStatements: string,
  testcase: Testcase,
  requiredExtensions: string[],
  signal?: AbortSignal,
): Promise<TestcaseDmlExecutionResult> {
  const combinedSql = buildCombinedSql(ddlStatements, testcase)
  const startTime = new Date()

  // eslint-disable-next-line no-restricted-syntax -- Try-catch needed for AbortSignal handling
  try {
    // Check if already aborted before executing
    if (signal?.aborted) {
      // eslint-disable-next-line no-throw-error/no-throw-error -- AbortSignal requires throwing to propagate cancellation
      throw new Error(`Test execution aborted: ${signal.reason || 'timeout'}`)
    }

    const sqlResults = await executeQuery(
      combinedSql,
      requiredExtensions,
      signal,
    )
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
  } catch (error) {
    // Handle abort/timeout errors
    if (signal?.aborted) {
      return {
        testCaseId: testcase.id,
        testCaseTitle: testcase.title,
        executedAt: startTime,
        success: false,
        failedOperation: {
          sql: `${combinedSql.substring(0, 100)}...`,
          error: `Test execution aborted: ${signal.reason || 'timeout'}`,
        },
      }
    }
    throw error
  }
}
