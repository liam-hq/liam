import type { TestCase } from '../../schemas/analyzedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

const updateTestcase = (
  testcases: Record<string, TestCase[]>,
  testcaseId: string,
  updates: Partial<TestCase>,
) => {
  for (const [category, categoryTestcases] of Object.entries(testcases)) {
    const testcaseIndex = categoryTestcases.findIndex(
      (tc) => tc.id === testcaseId,
    )
    if (testcaseIndex !== -1) {
      const existingTestcase = categoryTestcases[testcaseIndex]
      if (!existingTestcase) continue

      testcases[category] = [...categoryTestcases]
      testcases[category][testcaseIndex] = {
        ...existingTestcase,
        ...updates,
      }
      break
    }
  }
}

export const applyGeneratedSqlsNode = (state: QaAgentState) => {
  const { generatedSqls, skipReasons, analyzedRequirements } = state

  if (generatedSqls.length === 0 && skipReasons.length === 0) {
    return {}
  }

  const updatedTestcases = { ...analyzedRequirements.testcases }

  // Apply generated SQLs
  for (const { testcaseId, sql } of generatedSqls) {
    updateTestcase(updatedTestcases, testcaseId, { sql })
  }

  // Apply skip reasons
  for (const { testcaseId, reason } of skipReasons) {
    updateTestcase(updatedTestcases, testcaseId, { skipReason: reason })
  }

  return {
    analyzedRequirements: {
      ...analyzedRequirements,
      testcases: updatedTestcases,
    },
  }
}
