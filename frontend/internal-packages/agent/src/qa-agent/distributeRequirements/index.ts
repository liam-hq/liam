import { Send } from '@langchain/langgraph'
import type { WorkflowState } from '../../chat/workflow/types'
import { WorkflowTerminationError } from '../../shared/errorHandling'

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
 * Prepare requirements for distribution
 */
function prepareRequirements(state: WorkflowState): RequirementData[] {
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
    allRequirements.push({
      type: 'business',
      category: 'business',
      requirement: analyzedRequirements.businessRequirement,
      businessContext: businessContext,
    })
  }

  // Process functional requirements
  if (analyzedRequirements.functionalRequirements) {
    for (const [category, requirements] of Object.entries(
      analyzedRequirements.functionalRequirements,
    )) {
      if (requirements && requirements.length > 0) {
        for (const requirement of requirements) {
          allRequirements.push({
            type: 'functional',
            category,
            requirement,
            businessContext,
          })
        }
      }
    }
  }

  // Process non-functional requirements
  if (analyzedRequirements.nonFunctionalRequirements) {
    for (const [category, requirements] of Object.entries(
      analyzedRequirements.nonFunctionalRequirements,
    )) {
      if (requirements && requirements.length > 0) {
        for (const requirement of requirements) {
          allRequirements.push({
            type: 'non_functional',
            category,
            requirement,
            businessContext,
          })
        }
      }
    }
  }

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
export function continueToRequirements(state: WorkflowState) {
  const allRequirements = prepareRequirements(state)

  // Use Send API to distribute each requirement for parallel processing
  // Each requirement will be processed by testcaseGeneration with isolated state
  return allRequirements.map(
    (reqData) =>
      new Send('testcaseGeneration', {
        // Each subgraph gets its own isolated state
        currentRequirement: reqData,
        schemaData: state.schemaData,
        messages: [], // Start with empty messages for isolation
        testcases: [], // Will be populated by the subgraph
      }),
  )
}
