import { Send } from '@langchain/langgraph'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

/**
 * Requirement data structure for parallel processing
 */
export type RequirementData = {
  type: 'business' | 'functional' | 'non_functional'
  category: string
  requirement: string
  businessContext: string
}

/**
 * Add business requirement to the requirements list
 */
function addBusinessRequirement(
  requirements: RequirementData[],
  businessRequirement: string,
  businessContext: string,
): void {
  requirements.push({
    type: 'business',
    category: 'business',
    requirement: businessRequirement,
    businessContext,
  })
}

/**
 * Process requirements of a specific type
 */
function processRequirementsByType(
  requirements: RequirementData[],
  requirementsData: Record<string, string[]> | undefined,
  type: 'functional' | 'non_functional',
  businessContext: string,
): void {
  if (!requirementsData) return

  for (const [category, reqList] of Object.entries(requirementsData)) {
    if (reqList?.length > 0) {
      for (const requirement of reqList) {
        requirements.push({
          type,
          category,
          requirement,
          businessContext,
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

  if (!analyzedRequirements) {
    throw new WorkflowTerminationError(
      new Error(
        'No analyzed requirements found. Cannot distribute requirements for test case generation.',
      ),
      'continueToRequirements',
    )
  }

  const allRequirements: RequirementData[] = []
  const businessContext = analyzedRequirements.businessRequirement || ''

  // Add business requirement if exists
  if (analyzedRequirements.businessRequirement) {
    addBusinessRequirement(
      allRequirements,
      analyzedRequirements.businessRequirement,
      businessContext,
    )
  }

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
