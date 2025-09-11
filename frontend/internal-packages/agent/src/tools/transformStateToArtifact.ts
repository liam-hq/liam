import type {
  Artifact,
  DmlOperation,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { Testcase } from '../qa-agent/types'
import type { AnalyzedRequirements } from '../utils/schema/analyzedRequirements'

/**
 * Convert analyzed requirements to artifact requirements
 */
const convertAnalyzedRequirementsToArtifact = (
  analyzedRequirements: AnalyzedRequirements,
): {
  requirements: (FunctionalRequirement | NonFunctionalRequirement)[]
  requirementIdMap: Map<
    string,
    FunctionalRequirement | NonFunctionalRequirement
  >
} => {
  const requirements: (FunctionalRequirement | NonFunctionalRequirement)[] = []
  const requirementIdMap = new Map<
    string,
    FunctionalRequirement | NonFunctionalRequirement
  >()

  for (const [category, items] of Object.entries(
    analyzedRequirements.functionalRequirements,
  )) {
    const functionalRequirement: FunctionalRequirement = {
      type: 'functional',
      name: category,
      description: items.map((item) => item.desc), // Extract descriptions from RequirementItems
      test_cases: [], // Will be populated later if testcases exist
    }
    requirements.push(functionalRequirement)

    // Since we don't have individual IDs for string-based requirements,
    requirementIdMap.set(category, functionalRequirement)
  }

  for (const [category, items] of Object.entries(
    analyzedRequirements.nonFunctionalRequirements,
  )) {
    const nonFunctionalRequirement: NonFunctionalRequirement = {
      type: 'non_functional',
      name: category,
      description: items.map((item) => item.desc), // Extract descriptions from RequirementItems
    }
    requirements.push(nonFunctionalRequirement)

    // Since we don't have individual IDs for string-based requirements,
    requirementIdMap.set(category, nonFunctionalRequirement)
  }

  return { requirements, requirementIdMap }
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
 * Merge use cases into existing requirements using ID-based mapping
 */
const mergeTestCasesIntoRequirements = (
  requirementIdMap: Map<
    string,
    FunctionalRequirement | NonFunctionalRequirement
  >,
  testcases: Testcase[],
): void => {
  for (const testcase of testcases) {
    const requirement = requirementIdMap.get(testcase.requirementCategory)

    if (requirement && requirement.type === 'functional') {
      requirement.test_cases.push(mapTestCasesToRequirements(testcase))
    } else if (!requirement) {
      console.warn(
        `Testcase "${testcase.title}" references non-existent category: ${testcase.requirementCategory}`,
      )
    }
  }
}

type State = {
  analyzedRequirements: AnalyzedRequirements
  testcases: Testcase[]
}

/**
 * Transform WorkflowState to Artifact format
 * This handles the conversion from the workflow's data structure to the artifact schema
 */
export const transformStateToArtifact = (state: State): Artifact => {
  const businessRequirement = state.analyzedRequirements.businessRequirement

  const { requirements, requirementIdMap } =
    convertAnalyzedRequirementsToArtifact(state.analyzedRequirements)

  if (state.testcases.length > 0) {
    mergeTestCasesIntoRequirements(requirementIdMap, state.testcases)
  }

  return {
    requirement_analysis: {
      business_requirement: businessRequirement,
      requirements,
    },
  }
}
