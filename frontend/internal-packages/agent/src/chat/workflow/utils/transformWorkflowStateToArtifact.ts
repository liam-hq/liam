import type {
  Artifact,
  DmlOperation,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { Testcase } from '../../../qa-agent/types'
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
      test_cases: [], // Will be populated later if testcases exist
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
const mapTestCasesToRequirements = (
  testcase: Testcase,
): {
  title: string
  description: string
  dmlOperation: DmlOperation
} => ({
  title: testcase.title,
  description: testcase.description,
  dmlOperation: testcase.dmlOperation,
})

/**
 * Merge use cases into existing requirements
 */
const mergeTestCasesIntoRequirements = (
  requirements: (FunctionalRequirement | NonFunctionalRequirement)[],
  testcases: Testcase[],
): void => {
  const requirementGroups = groupTestcasesByRequirement(testcases)

  for (const [category, data] of Object.entries(requirementGroups)) {
    const { type, testcases: groupedTestcases, description } = data
    const existingReq = requirements.find((req) => req.name === category)

    if (
      existingReq &&
      existingReq.type === 'functional' &&
      type === 'functional'
    ) {
      existingReq.test_cases = groupedTestcases.map(mapTestCasesToRequirements)
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
          test_cases: groupedTestcases.map(mapTestCasesToRequirements),
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

  if (state.testcases.length > 0) {
    mergeTestCasesIntoRequirements(requirements, state.testcases)
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
const groupTestcasesByRequirement = (testcases: Testcase[]) => {
  const groups: Record<
    string,
    {
      type: 'functional' | 'non_functional'
      testcases: Testcase[]
      description?: string
    }
  > = {}

  for (const testcase of testcases) {
    const category = testcase.requirementCategory

    if (!groups[category]) {
      groups[category] = {
        type: testcase.requirementType,
        testcases: [],
        description: testcase.requirement, // Use the first requirement description
      }
    }

    groups[category].testcases.push(testcase)
  }

  return groups
}
