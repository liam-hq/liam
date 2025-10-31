import type { TestCase } from '../../schemas/analyzedRequirements'

/**
 * Formats previous test failures for inclusion in the prompt
 * @param testcase - The test case with test results
 * @returns Formatted string describing previous failures, or empty string if no failures
 */
export const formatPreviousFailures = (testcase: TestCase): string => {
  const failedResults = testcase.testResults.filter((result) => !result.success)

  if (failedResults.length === 0) {
    return ''
  }

  const failuresText = failedResults
    .map((result, index) => {
      return `
## Previous Attempt ${index + 1}
Executed At: ${result.executedAt}
Error Message:
\`\`\`
${result.message}
\`\`\`
`
    })
    .join('\n')

  return `
# Previous Test Failures

This test case has failed ${failedResults.length} time(s). Please analyze the error messages below and generate SQL that avoids these issues:
${failuresText}
`
}
