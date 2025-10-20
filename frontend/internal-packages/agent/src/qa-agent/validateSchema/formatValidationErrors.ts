import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
import { classifyTestFailure, type ErrorCategory } from '../../utils/classifyError'

type FailedTestCase = {
  title: string
  sql: string
  error: string
  category: ErrorCategory
  errorCode?: string
  errorName?: string
}

/**
 * Format validation errors from test results
 *
 * This function classifies errors into:
 * - Schema problems (DB Agent should fix)
 * - SQL quality problems (QA Agent should fix)
 *
 * Only schema problems are included in the main error report for DB Agent feedback.
 */
export function formatValidationErrors(
  analyzedRequirements: AnalyzedRequirements,
): string {
  const schemaProblems: FailedTestCase[] = []
  const sqlQualityProblems: FailedTestCase[] = []
  const unknownProblems: FailedTestCase[] = []

  for (const testcases of Object.values(analyzedRequirements.testcases)) {
    for (const testcase of testcases) {
      // Check if the latest test result failed
      const latestResult = testcase.testResults[testcase.testResults.length - 1]
      if (latestResult && !latestResult.success) {
        // Classify the error
        const classification = classifyTestFailure(latestResult.message)

        const failedTest: FailedTestCase = {
          title: testcase.title,
          sql: testcase.sql,
          error: latestResult.message,
          category: classification.category,
          ...(classification.errorCode !== undefined && { errorCode: classification.errorCode }),
          ...(classification.errorName !== undefined && { errorName: classification.errorName }),
        }

        // Categorize based on classification
        if (classification.category === 'schema') {
          schemaProblems.push(failedTest)
        } else if (classification.category === 'sql_quality') {
          sqlQualityProblems.push(failedTest)
        } else {
          unknownProblems.push(failedTest)
        }
      }
    }
  }

  const totalFailed = schemaProblems.length + sqlQualityProblems.length + unknownProblems.length

  if (totalFailed === 0) {
    return 'Database validation complete: all checks passed successfully'
  }

  const sections: string[] = []

  // Schema problems - these need DB Agent attention
  if (schemaProblems.length > 0) {
    sections.push('## 🔧 Schema Issues (DB Agent should fix these)')
    sections.push('')
    sections.push(formatTestCaseList(schemaProblems))
  }

  // SQL quality problems - these need QA Agent attention
  if (sqlQualityProblems.length > 0) {
    sections.push('## 📝 SQL Quality Issues (QA Agent should fix these)')
    sections.push('')
    sections.push(formatTestCaseList(sqlQualityProblems))
  }

  // Unknown problems - need investigation
  if (unknownProblems.length > 0) {
    sections.push('## ⚠️ Unknown Issues (Need investigation)')
    sections.push('')
    sections.push(formatTestCaseList(unknownProblems))
  }

  // Summary
  const summary = [
    '## Summary',
    `- Schema problems: ${schemaProblems.length}`,
    `- SQL quality problems: ${sqlQualityProblems.length}`,
    `- Unknown problems: ${unknownProblems.length}`,
    `- **Total failures: ${totalFailed}**`,
  ].join('\n')

  return [summary, '', ...sections].join('\n')
}

/**
 * Format a list of test cases with detailed error information
 */
function formatTestCaseList(testCases: FailedTestCase[]): string {
  return testCases
    .map((testCase) => {
      const errorCodeInfo = testCase.errorCode
        ? ` (${testCase.errorCode}${testCase.errorName ? `: ${testCase.errorName}` : ''})`
        : ''

      return [
        `### ❌ **${testCase.title}**`,
        `**Error${errorCodeInfo}:**`,
        '```',
        testCase.error,
        '```',
        '**Test code:**',
        '```sql',
        testCase.sql,
        '```',
      ].join('\n')
    })
    .join('\n\n')
}
