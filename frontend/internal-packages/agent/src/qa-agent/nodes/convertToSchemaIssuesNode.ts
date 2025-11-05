import { END } from '@langchain/langgraph'
import type { SchemaIssue } from '../../workflowSchemaIssuesAnnotation'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

/**
 * Converts failed schema test IDs to SchemaIssue format for DB agent processing
 * Extracts error messages from test results and creates schema issues
 * @param state - QA agent state with failureAnalysis
 * @returns Updated state with schemaIssues and END signal
 */
export const convertToSchemaIssuesNode = (state: QaAgentState) => {
  const { failureAnalysis, analyzedRequirements } = state

  if (!failureAnalysis || failureAnalysis.failedSchemaTestIds.length === 0) {
    return {}
  }

  const schemaIssues: SchemaIssue[] = []

  for (const testId of failureAnalysis.failedSchemaTestIds) {
    for (const testcases of Object.values(analyzedRequirements.testcases)) {
      const testcase = testcases.find((tc) => tc.id === testId)
      if (!testcase) continue

      const lastResult = testcase.testResults[testcase.testResults.length - 1]
      if (!lastResult) continue

      schemaIssues.push({
        testcaseId: testcase.id,
        description: `Test "${testcase.title}" failed with schema issue: ${lastResult.message}`,
      })
    }
  }

  return {
    schemaIssues,
    next: END,
  }
}
