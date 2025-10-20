import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'

type FailedTestCase = {
  title: string
  sql: string
  error: string
}

export function formatValidationErrors(
  analyzedRequirements: AnalyzedRequirements,
): string {
  const failedTestCases: FailedTestCase[] = []

  for (const testcases of Object.values(analyzedRequirements.testcases)) {
    for (const testcase of testcases) {
      // Check if the latest test result failed
      const latestResult = testcase.testResults[testcase.testResults.length - 1]
      if (latestResult && !latestResult.success) {
        failedTestCases.push({
          title: testcase.title,
          sql: testcase.sql,
          error: latestResult.message,
        })
      }
    }
  }

  if (failedTestCases.length === 0) {
    return 'Database validation complete: all checks passed successfully'
  }

  const errorDetails = failedTestCases
    .map((testCase) => {
      return `### ❌ **Test Case:** ${testCase.title}\n#### Error: \`${testCase.error}\`\n\`\`\`sql\n${testCase.sql}\n\`\`\``
    })
    .join('\n\n')

  return errorDetails
}
