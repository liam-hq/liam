import type {
  Artifact,
  DmlOperation,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent.ts'
import type { Repositories } from '../../../repositories/index.ts'
import type { WorkflowState } from '../types.ts'

/**
 * Convert analyzed requirements to artifact requirements
 */
const convertAnalyzedRequirementsToArtifact = (
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
): (FunctionalRequirement | NonFunctionalRequirement)[] => {
  const requirements: (FunctionalRequirement | NonFunctionalRequirement)[] = []

  // Add functional requirements
  for (const [category, items] of Object.entries(
    analyzedRequirements.functionalRequirements,
  )) {
    const functionalRequirement: FunctionalRequirement = {
      type: 'functional',
      name: category,
      description: items.join(', '),
      use_cases: [], // Will be populated later if usecases exist
    }
    requirements.push(functionalRequirement)
  }

  // Add non-functional requirements
  for (const [category, items] of Object.entries(
    analyzedRequirements.nonFunctionalRequirements,
  )) {
    const nonFunctionalRequirement: NonFunctionalRequirement = {
      type: 'non_functional',
      name: category,
      description: items.join(', '),
    }
    requirements.push(nonFunctionalRequirement)
  }

  return requirements
}

/**
 * Map use cases to functional requirements
 */
const mapUseCasesToRequirements = (
  usecase: Usecase,
): { title: string; description: string; dml_operations: DmlOperation[] } => ({
  title: usecase.title,
  description: usecase.description,
  dml_operations: usecase.dmlOperations, // Use the actual dmlOperations from usecase
})

/**
 * Merge use cases into existing requirements
 */
const mergeUseCasesIntoRequirements = (
  requirements: (FunctionalRequirement | NonFunctionalRequirement)[],
  usecases: Usecase[],
): void => {
  const requirementGroups = groupUsecasesByRequirement(usecases)

  for (const [category, data] of Object.entries(requirementGroups)) {
    const { type, usecases: groupedUsecases, description } = data
    const existingReq = requirements.find((req) => req.name === category)

    if (
      existingReq &&
      existingReq.type === 'functional' &&
      type === 'functional'
    ) {
      // Update existing functional requirement with use cases
      existingReq.use_cases = groupedUsecases.map(mapUseCasesToRequirements)
    } else if (!existingReq) {
      // Add new requirement from use cases if it doesn't exist
      if (type === 'functional') {
        const functionalRequirement: FunctionalRequirement = {
          type: 'functional',
          name: category,
          description: description || `Functional requirement: ${category}`,
          use_cases: groupedUsecases.map(mapUseCasesToRequirements),
        }
        requirements.push(functionalRequirement)
      } else {
        const nonFunctionalRequirement: NonFunctionalRequirement = {
          type: 'non_functional',
          name: category,
          description: description || `Non-functional requirement: ${category}`,
        }
        requirements.push(nonFunctionalRequirement)
      }
    }
  }
}

/**
 * Transform WorkflowState to Artifact format
 * This handles the conversion from the workflow's data structure to the artifact schema
 */
export const transformWorkflowStateToArtifact = (
  state: WorkflowState,
): Artifact => {
  const businessRequirement =
    state.analyzedRequirements?.businessRequirement ?? ''

  // Start with requirements from analyzedRequirements
  const requirements = state.analyzedRequirements
    ? convertAnalyzedRequirementsToArtifact(state.analyzedRequirements)
    : []

  // Then merge in use cases if they exist
  if (state.generatedUsecases && state.generatedUsecases.length > 0) {
    mergeUseCasesIntoRequirements(requirements, state.generatedUsecases)
  }

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
