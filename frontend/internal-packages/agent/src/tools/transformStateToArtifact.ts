import type { Artifact, DmlOperation, Requirement } from '@liam-hq/artifact'
import type { Testcase } from '../qa-agent/types'
import type { WorkflowState } from '../types'
import type { AnalyzedRequirements } from '../utils/schema/analyzedRequirements'

// TODO: Deprecate this transformation layer in the future.
// Plan to use AnalyzedRequirements structure directly instead of converting to Artifact format.
// This will eliminate redundant type conversions between AnalyzedRequirements and Artifact.
// Related: frontend/internal-packages/artifact/src/schemas/artifact.ts

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
): Requirement[] => {
  const requirements: Requirement[] = []

  for (const [category, testcases] of Object.entries(
    analyzedRequirements.testcases,
  )) {
    const requirement: Requirement = {
      name: category,
      description: [analyzedRequirements.goal],
      test_cases: testcases.map((tc) => ({
        title: tc.title,
        description: `Test for ${tc.type} operation`,
        dmlOperation: {
          operation_type: tc.type,
          sql: tc.sql,
          description: tc.title,
          dml_execution_logs: [],
        },
      })),
    }
    requirements.push(requirement)
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
  requirements: Requirement[],
  testcases: Testcase[],
): void => {
  const requirementGroups = groupTestcasesByRequirement(testcases)

  for (const [category, data] of Object.entries(requirementGroups)) {
    const { type, testcases: groupedTestcases, description } = data
    const existingReq = requirements.find((req) => req.name === category)

    if (existingReq && type === 'functional') {
      existingReq.test_cases = groupedTestcases.map(mapTestCasesToRequirements)
    } else if (!existingReq && type === 'functional') {
      const requirement: Requirement = {
        name: category,
        description: wrapDescription(
          description,
          'Functional requirement: ',
          category,
        ),
        test_cases: groupedTestcases.map(mapTestCasesToRequirements),
      }
      requirements.push(requirement)
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
  const businessRequirement = state.analyzedRequirements.goal

  const requirements = convertAnalyzedRequirementsToArtifact(
    state.analyzedRequirements,
  )

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
