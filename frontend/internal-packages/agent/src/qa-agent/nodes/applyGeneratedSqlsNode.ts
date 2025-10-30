import { clearBatch } from '../../utils/progressRuntime'
import { dispatchBatchCompleteEvent } from '../../utils/progressTracking'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

export const applyGeneratedSqlsNode = async (state: QaAgentState) => {
  const { generatedSqls, analyzedRequirements, batchId, totalTestcases } = state

  if (batchId && totalTestcases) {
    await dispatchBatchCompleteEvent(
      {
        total: totalTestcases,
        message: `Test case generation complete: ${totalTestcases} test cases processed`,
      },
      'qa',
    )
    clearBatch(batchId)
  }

  if (generatedSqls.length === 0) {
    return {}
  }

  const updatedTestcases = { ...analyzedRequirements.testcases }

  for (const { testcaseId, sql } of generatedSqls) {
    for (const [category, testcases] of Object.entries(updatedTestcases)) {
      const testcaseIndex = testcases.findIndex((tc) => tc.id === testcaseId)
      if (testcaseIndex !== -1) {
        const updatedTestcase = testcases[testcaseIndex]
        if (!updatedTestcase) continue

        updatedTestcases[category] = [...testcases]
        updatedTestcases[category][testcaseIndex] = {
          id: updatedTestcase.id,
          title: updatedTestcase.title,
          type: updatedTestcase.type,
          testResults: updatedTestcase.testResults,
          sql,
        }
        break
      }
    }
  }

  return {
    analyzedRequirements: {
      ...analyzedRequirements,
      testcases: updatedTestcases,
    },
  }
}
