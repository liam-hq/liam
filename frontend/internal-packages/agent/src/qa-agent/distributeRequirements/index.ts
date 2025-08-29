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
      'distributeRequirements',
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
      'distributeRequirements',
    )
  }

  return allRequirements
}

/**
 * Distribute Requirements Node - Prepare state for map-reduce pattern
 * This node just validates and returns empty update
 */
export function distributeRequirements(state: WorkflowState) {
  // Validate that requirements exist
  prepareRequirements(state)

  // Just validate and return empty state update
  // The actual Send objects are returned by continueToRequirements function
  return {}
}

/**
 * Conditional edge function to create Send objects for parallel processing
 * This is called after distributeRequirements node
 */
export function continueToRequirements(state: WorkflowState) {
  const allRequirements = prepareRequirements(state)

  // Use Send API to distribute each requirement for parallel processing
  // Each requirement will be processed by testcaseSubgraph with isolated state
  return allRequirements.map(
    (reqData) =>
      new Send('testcaseSubgraph', {
        // Each subgraph gets its own isolated state
        currentRequirement: reqData,
        schemaData: state.schemaData,
        messages: [], // Start with empty messages for isolation
        generatedTestcases: [], // Will be populated by the subgraph
      }),
  )
}
