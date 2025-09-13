import { Send } from '@langchain/langgraph'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import type { RequirementItem } from '../../utils/schema/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

/**
 * Requirement data structure for parallel processing
 */
export type RequirementData = {
  type: 'functional' | 'non_functional'
  category: string
  requirement: string
  businessContext: string
  requirementId: string
}

/**
 * Process requirements of a specific type
 */
function processRequirementsByType(
  requirements: RequirementData[],
  requirementsData: Record<string, RequirementItem[]> | undefined,
  type: 'functional' | 'non_functional',
  businessContext: string,
): void {
  if (!requirementsData) return

  for (const [category, reqList] of Object.entries(requirementsData)) {
    if (reqList?.length > 0) {
      for (const requirementItem of reqList) {
        requirements.push({
          type,
          category,
          requirement: requirementItem.desc,
          businessContext,
          requirementId: requirementItem.id,
        })
      }
    }
  }
}

/**
 * Prepare requirements for distribution
 */
function prepareRequirements(state: QaAgentState): RequirementData[] {
  const { analyzedRequirements } = state
  const allRequirements: RequirementData[] = []
  const businessContext = analyzedRequirements.businessRequirement || ''

  // Process functional requirements
  processRequirementsByType(
    allRequirements,
    analyzedRequirements.functionalRequirements,
    'functional',
    businessContext,
  )

  // Process non-functional requirements
  processRequirementsByType(
    allRequirements,
    analyzedRequirements.nonFunctionalRequirements,
    'non_functional',
    businessContext,
  )

  // If no requirements found, throw error
  if (allRequirements.length === 0) {
    throw new WorkflowTerminationError(
      new Error('No requirements to process after distribution.'),
      'continueToRequirements',
    )
  }

  return allRequirements
}

/**
 * Conditional edge function to create Send objects for parallel processing
 * This is called directly from START node
 */
export function continueToRequirements(state: QaAgentState) {
  const allRequirements = prepareRequirements(state)
  const schemaContext = convertSchemaToText(state.schemaData)

  // Use Send API to distribute each requirement for parallel processing
  // Each requirement will be processed by testcaseGeneration with isolated state
  return allRequirements.map(
    (reqData) =>
      new Send('testcaseGeneration', {
        // Each subgraph gets its own isolated state
        currentRequirement: reqData,
        schemaContext,
        messages: [], // Start with empty messages for isolation
        testcases: [], // Will be populated by the subgraph
      }),
  )
}
