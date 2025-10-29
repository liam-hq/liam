import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { SSE_EVENTS } from '../../streaming/constants'
import { CONCURRENT_TESTCASE_LIMIT } from '../distributeRequirements/constants'
import { getUnprocessedRequirements } from '../distributeRequirements/getUnprocessedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { testcaseGeneration } from '../testcaseGeneration'

async function processBatch(
  testcases: ReturnType<typeof getUnprocessedRequirements>,
  state: QaAgentState,
) {
  const batchPromises = testcases.map(async (testcaseData) => {
    const result = await testcaseGeneration.invoke({
      currentTestcase: testcaseData,
      schemaData: state.schemaData,
      goal: state.analyzedRequirements.goal,
      messages: [],
      schemaIssues: [],
      generatedSqls: [],
    })

    return result
  })

  return Promise.all(batchPromises)
}

export async function processBatchedTestcasesNode(
  state: QaAgentState,
): Promise<Partial<QaAgentState>> {
  const targetTestcases = getUnprocessedRequirements(state)
  const totalTestcases = targetTestcases.length

  if (totalTestcases === 0) {
    return {}
  }

  await dispatchCustomEvent(SSE_EVENTS.PROGRESS, {
    total: totalTestcases,
    completed: 0,
    message: `Starting test case generation: ${totalTestcases} test cases to process`,
  })

  const allSchemaIssues: QaAgentState['schemaIssues'] = []
  const allGeneratedSqls: QaAgentState['generatedSqls'] = []
  let completedCount = 0

  for (let i = 0; i < targetTestcases.length; i += CONCURRENT_TESTCASE_LIMIT) {
    const batch = targetTestcases.slice(i, i + CONCURRENT_TESTCASE_LIMIT)
    const batchResults = await processBatch(batch, state)

    for (const result of batchResults) {
      if (result.schemaIssues) {
        allSchemaIssues.push(...result.schemaIssues)
      }
      if (result.generatedSqls) {
        allGeneratedSqls.push(...result.generatedSqls)
      }
    }

    completedCount += batch.length

    await dispatchCustomEvent(SSE_EVENTS.PROGRESS, {
      total: totalTestcases,
      completed: completedCount,
      message: `Progress: ${completedCount}/${totalTestcases} test cases completed`,
    })
  }

  await dispatchCustomEvent(SSE_EVENTS.BATCH_COMPLETE, {
    total: totalTestcases,
    message: `Test case generation complete: ${totalTestcases} test cases generated`,
  })

  return {
    schemaIssues: allSchemaIssues,
    generatedSqls: allGeneratedSqls,
  }
}
