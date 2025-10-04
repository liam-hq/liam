import type { Artifact, Requirement } from '@liam-hq/artifact'
import type { AnalyzedRequirements } from '../utils/schema/analyzedRequirements'

type State = {
  analyzedRequirements: AnalyzedRequirements
}

/**
 * Transform AnalyzedRequirements to Artifact format
 * This handles the conversion from the workflow's data structure to the artifact schema
 */
export const transformStateToArtifact = (state: State): Artifact => {
  const requirements: Requirement[] = []

  for (const [category, testcases] of Object.entries(
    state.analyzedRequirements.testcases,
  )) {
    const requirement: Requirement = {
      name: category,
      description: [],
      test_cases: testcases.map((tc) => ({
        title: tc.title,
        description: '',
        dmlOperation: {
          operation_type: tc.type,
          sql: tc.sql,
          description: '',
          dml_execution_logs: tc.testResults.map((tr) => ({
            executed_at: tr.executedAt,
            success: tr.success,
            result_summary: tr.resultSummary,
          })),
        },
      })),
    }
    requirements.push(requirement)
  }

  return {
    requirement_analysis: {
      business_requirement: state.analyzedRequirements.goal,
      requirements,
    },
  }
}
