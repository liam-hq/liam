import { err, ok, type Result } from 'neverthrow'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import type { TestCase } from '../../utils/schema/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import type { RequirementData } from './types'

/**
 * Process test cases from a specific category
 */
function processTestCasesByCategory(
  requirements: RequirementData[],
  category: string,
  testCases: TestCase[] | undefined,
  businessContext: string,
): void {
  if (!testCases || testCases.length === 0) return

  for (const testCase of testCases) {
    if (!testCase.sql || testCase.sql.trim() === '') {
      requirements.push({
        type: 'functional',
        category,
        requirement: testCase.title,
        businessContext,
        requirementId: testCase.title, // Use title as ID for now
      })
    }
  }
}

/**
 * Prepare all requirements for processing
 */
function prepareRequirements(
  state: QaAgentState,
): Result<RequirementData[], WorkflowTerminationError> {
  const { analyzedRequirements } = state
  const allRequirements: RequirementData[] = []
  const businessContext = analyzedRequirements.goal || ''

  // Process test cases from all categories
  for (const [category, testCases] of Object.entries(
    analyzedRequirements.testcases,
  )) {
    processTestCasesByCategory(
      allRequirements,
      category,
      testCases,
      businessContext,
    )
  }

  // If no requirements found, return error
  if (allRequirements.length === 0) {
    return err(
      new WorkflowTerminationError(
        new Error('No requirements to process after distribution.'),
        'continueToRequirements',
      ),
    )
  }

  return ok(allRequirements)
}

/**
 * Get unprocessed requirements (test cases without SQL)
 */
export function getUnprocessedRequirements(
  state: QaAgentState,
): RequirementData[] {
  const requirementsResult = prepareRequirements(state)

  if (requirementsResult.isErr()) {
    // If prepareRequirements fails (no requirements), return empty array
    return []
  }

  return requirementsResult.value
}
