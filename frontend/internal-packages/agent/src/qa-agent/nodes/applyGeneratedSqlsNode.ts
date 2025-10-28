import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import type { RunnableConfig } from '@langchain/core/runnables'
import { SSE_EVENTS } from '../../streaming/constants'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

export const applyGeneratedSqlsNode = async (
  state: QaAgentState,
  _config: RunnableConfig,
) => {
  const { generatedSqls, analyzedRequirements } = state

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

  const updatedAnalyzedRequirements = {
    ...analyzedRequirements,
    testcases: updatedTestcases,
  }

  await dispatchCustomEvent(
    SSE_EVENTS.ANALYZED_REQUIREMENTS,
    updatedAnalyzedRequirements,
  )

  return {
    analyzedRequirements: updatedAnalyzedRequirements,
  }
}
