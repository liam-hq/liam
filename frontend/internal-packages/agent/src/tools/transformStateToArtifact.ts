import type {
  Artifact,
  DmlOperation,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { Testcase } from '../qa-agent/types'
import type { AnalyzedRequirements } from '../utils/schema/analyzedRequirements'

type TestCase = {
  title: string
  description: string
  dmlOperation: DmlOperation
}

const createTestCase = (testcase: Testcase): TestCase => ({
  title: testcase.title,
  description: testcase.description,
  dmlOperation: testcase.dmlOperation,
})

const createFunctionalRequirement = (
  category: string,
  description: string[],
  testCases: TestCase[] = [],
): FunctionalRequirement => ({
  type: 'functional',
  name: category,
  description,
  test_cases: testCases,
})

const createNonFunctionalRequirement = (
  category: string,
  description: string[],
): NonFunctionalRequirement => ({
  type: 'non_functional',
  name: category,
  description,
})

const groupTestCasesByRequirementId = (
  testcases: Testcase[],
): Map<string, TestCase[]> => {
  const grouped = new Map<string, TestCase[]>()

  for (const testcase of testcases) {
    if (testcase.requirementType !== 'functional') continue

    const requirementId = testcase.requirementId
    if (!grouped.has(requirementId)) {
      grouped.set(requirementId, [])
    }
    grouped.get(requirementId)?.push(createTestCase(testcase))
  }

  return grouped
}

type State = {
  analyzedRequirements: AnalyzedRequirements
  testcases: Testcase[]
}

/**
 * Transform WorkflowState to Artifact format with immutable design
 */
export const transformStateToArtifact = (state: State): Artifact => {
  const { analyzedRequirements, testcases } = state
  const testCasesByRequirementId = groupTestCasesByRequirementId(testcases)

  const functionalRequirements = Object.entries(
    analyzedRequirements.functionalRequirements,
  ).map(([category, items]) => {
    // Collect test cases for all requirement items in this category
    const allTestCases: TestCase[] = []
    for (const item of items) {
      const testCases = testCasesByRequirementId.get(item.id) || []
      allTestCases.push(...testCases)
    }

    const descriptions = items.map((item) => item.desc)
    return createFunctionalRequirement(category, descriptions, allTestCases)
  })

  const nonFunctionalRequirements = Object.entries(
    analyzedRequirements.nonFunctionalRequirements,
  ).map(([category, items]) => {
    const descriptions = items.map((item) => item.desc)
    return createNonFunctionalRequirement(category, descriptions)
  })

  return {
    requirement_analysis: {
      business_requirement: analyzedRequirements.businessRequirement,
      requirements: [...functionalRequirements, ...nonFunctionalRequirements],
    },
  }
}
