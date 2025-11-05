import { END } from '@langchain/langgraph'
import { QA_AGENT_MAX_ATTEMPTS } from '../../constants'
import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

const hasRetryLimitReached = (
  testIds: string[],
  analyzedRequirements: AnalyzedRequirements,
): boolean => {
  for (const testId of testIds) {
    for (const testcases of Object.values(analyzedRequirements.testcases)) {
      const testcase = testcases.find((tc) => tc.id === testId)
      if (testcase && testcase.testResults.length >= QA_AGENT_MAX_ATTEMPTS) {
        return true
      }
    }
  }
  return false
}

export const routeAfterAnalyzeFailures = (
  state: QaAgentState,
): 'resetFailedSqlTests' | 'convertToSchemaIssues' | typeof END => {
  const { failureAnalysis, analyzedRequirements } = state

  if (!failureAnalysis) {
    return END
  }

  const hasSqlIssues = failureAnalysis.failedSqlTestIds.length > 0
  const hasSchemaIssues = failureAnalysis.failedSchemaTestIds.length > 0

  if (!hasSqlIssues && !hasSchemaIssues) {
    return END
  }

  // Prioritize SQL issues as they are faster to fix
  if (
    hasSqlIssues &&
    !hasRetryLimitReached(
      failureAnalysis.failedSqlTestIds,
      analyzedRequirements,
    )
  ) {
    return 'resetFailedSqlTests'
  }

  // If there are schema issues, pass them to DB Agent regardless of retry limit
  if (hasSchemaIssues) {
    return 'convertToSchemaIssues'
  }

  return END
}
