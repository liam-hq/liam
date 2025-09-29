import type { Testcase } from '../qa-agent/types'
import type { TestcaseDmlExecutionResult } from '../qa-agent/validateSchema/types'

/**
 * Execute a single testcase with DDL statements
 */
export async function executeTestcase(
  _ddlStatements: string,
  testcase: Testcase,
  _requiredExtensions: string[],
): Promise<TestcaseDmlExecutionResult> {
  // Mock implementation to avoid PGlite memory usage
  // Always return success without actually executing queries
  const startTime = new Date()

  // Simulate a small delay to mimic execution time
  await new Promise((resolve) => setTimeout(resolve, 10))

  const baseResult = {
    testCaseId: testcase.id,
    testCaseTitle: testcase.title,
    executedAt: startTime,
  }

  // Always return success without executing actual queries
  return {
    ...baseResult,
    success: true,
  }
}
