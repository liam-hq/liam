import type {
  Artifact,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'

/**
 * Transform WorkflowState to Artifact format
 * This handles the conversion from the workflow's data structure to the artifact schema
 */
export const transformWorkflowStateToArtifact = (
  state: WorkflowState,
): Artifact => {
  const businessRequirement =
    state.analyzedRequirements?.businessRequirement ?? ''
  const usecases = state.generatedUsecases || []

  // Group use cases by requirement category and type
  const requirementGroups = groupUsecasesByRequirement(usecases)

  // Convert grouped requirements to the artifact format
  const requirements = Object.entries(requirementGroups).map(
    ([category, data]) => {
      const { type, usecases: groupedUsecases, description } = data

      if (type === 'functional') {
        const functionalRequirement: FunctionalRequirement = {
          type: 'functional',
          name: category,
          description: description || `Functional requirement: ${category}`,
          use_cases: groupedUsecases.map((usecase) => ({
            title: usecase.title,
            description: usecase.description,
            dml_operations: [], // Empty for now - to be populated when DML tracking is added
          })),
        }
        return functionalRequirement
      }

      const nonFunctionalRequirement: NonFunctionalRequirement = {
        type: 'non_functional',
        name: category,
        description: description || `Non-functional requirement: ${category}`,
      }
      return nonFunctionalRequirement
    },
  )

  return {
    requirement_analysis: {
      business_requirement: businessRequirement,
      requirements,
    },
  }
}

/**
 * Group use cases by requirement category and type
 */
const groupUsecasesByRequirement = (usecases: Usecase[]) => {
  const groups: Record<
    string,
    {
      type: 'functional' | 'non_functional'
      usecases: Usecase[]
      description?: string
    }
  > = {}

  for (const usecase of usecases) {
    const category = usecase.requirementCategory

    if (!groups[category]) {
      groups[category] = {
        type: usecase.requirementType,
        usecases: [],
        description: usecase.requirement, // Use the first requirement description
      }
    }

    groups[category].usecases.push(usecase)
  }

  return groups
}

/**
 * Create an artifact with upsert logic
 * Tries to update existing artifact first, creates new one if not found
 */
export const createOrUpdateArtifact = async (
  state: WorkflowState,
  artifact: Artifact,
  repositories: Repositories,
): Promise<{ success: boolean; error?: string }> => {
  // Try to get existing artifact first
  const existingResult = await repositories.schema.getArtifact(
    state.designSessionId,
  )

  if (existingResult.success) {
    // Artifact exists, update it
    const updateResult = await repositories.schema.updateArtifact({
      designSessionId: state.designSessionId,
      artifact,
    })

    if (updateResult.success) {
      return { success: true }
    }
    return { success: false, error: updateResult.error }
  }

  // Check if the failure is due to "not found" vs actual error
  if (existingResult.error !== 'Artifact not found') {
    return { success: false, error: existingResult.error }
  }

  // Artifact doesn't exist, create new one
  const createResult = await repositories.schema.createArtifact({
    designSessionId: state.designSessionId,
    artifact,
  })

  if (createResult.success) {
    return { success: true }
  }
  return { success: false, error: createResult.error }
}
