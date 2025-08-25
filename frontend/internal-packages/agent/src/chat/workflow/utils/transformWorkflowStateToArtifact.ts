import type {
  Artifact,
  DmlOperation,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { WorkflowState } from '../types'

/**
 * Wraps a description string in an array format with fallback
 */
const wrapDescription = (
  description: string | undefined,
  prefix: string,
  category: string,
): string[] => {
  return description ? [description] : [`${prefix}${category}`]
}

/**
 * Convert analyzed requirements to artifact requirements
 */
const convertAnalyzedRequirementsToArtifact = (
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
): (FunctionalRequirement | NonFunctionalRequirement)[] => {
  const requirements: (FunctionalRequirement | NonFunctionalRequirement)[] = []

  for (const [category, items] of Object.entries(
    analyzedRequirements.functionalRequirements,
  )) {
    const functionalRequirement: FunctionalRequirement = {
      type: 'functional',
      name: category,
      description: items, // Keep as array
      use_cases: [], // Will be populated later if usecases exist
    }
    requirements.push(functionalRequirement)
  }

  for (const [category, items] of Object.entries(
    analyzedRequirements.nonFunctionalRequirements,
  )) {
    const nonFunctionalRequirement: NonFunctionalRequirement = {
      type: 'non_functional',
      name: category,
      description: items, // Keep as array
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
      existingReq.use_cases = groupedUsecases.map(mapUseCasesToRequirements)
    } else if (!existingReq) {
      if (type === 'functional') {
        const functionalRequirement: FunctionalRequirement = {
          type: 'functional',
          name: category,
          description: wrapDescription(
            description,
            'Functional requirement: ',
            category,
          ),
          use_cases: groupedUsecases.map(mapUseCasesToRequirements),
        }
        requirements.push(functionalRequirement)
      } else {
        const nonFunctionalRequirement: NonFunctionalRequirement = {
          type: 'non_functional',
          name: category,
          description: wrapDescription(
            description,
            'Non-functional requirement: ',
            category,
          ),
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

  const requirements = state.analyzedRequirements
    ? convertAnalyzedRequirementsToArtifact(state.analyzedRequirements)
    : []

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
