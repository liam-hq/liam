import type { RunnableConfig } from '@langchain/core/runnables'
import {
  dispatchBatchCompleteEvent,
  dispatchBatchStartEvent,
  dispatchProgressEvent,
} from '../../utils/progressTracking'
import type { TestCaseData } from '../distributeRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { testcaseGeneration } from '../testcaseGeneration'

const CONCURRENT_TESTCASE_LIMIT = 3

/**
 * Process testcases in batches with progress tracking
 * This node replaces the parallel Send-based execution with controlled batching
 */
export async function batchTestcaseGenerationNode(
  state: QaAgentState,
  config: RunnableConfig,
): Promise<Partial<QaAgentState>> {
  const { analyzedRequirements, schemaData } = state

  const allTestcases: TestCaseData[] = []
  for (const [category, testcases] of Object.entries(
    analyzedRequirements.testcases,
  )) {
    for (const testcase of testcases) {
      if (!testcase.sql || testcase.sql === '') {
        allTestcases.push({ category, testcase })
      }
    }
  }

  const totalTestcases = allTestcases.length

  if (totalTestcases === 0) {
    return {}
  }

  await dispatchBatchStartEvent(
    {
      total: totalTestcases,
      message: `Starting test case generation: processing ${totalTestcases} requirements...`,
    },
    'qa',
  )

  const generatedSqls: Array<{ testcaseId: string; sql: string }> = []
  const schemaIssues: Array<{ testcaseId: string; description: string }> = []

  for (let i = 0; i < allTestcases.length; i += CONCURRENT_TESTCASE_LIMIT) {
    const batch = allTestcases.slice(i, i + CONCURRENT_TESTCASE_LIMIT)

    const batchPromises = batch.map(async (testcaseData) => {
      const subgraphState = {
        currentTestcase: testcaseData,
        schemaData,
        goal: analyzedRequirements.goal,
        messages: [],
      }

      const result = await testcaseGeneration.invoke(subgraphState, config)

      return {
        generatedSqls: result.generatedSqls || [],
        schemaIssues: result.schemaIssues || [],
      }
    })

    const batchResults = await Promise.all(batchPromises)

    for (const result of batchResults) {
      generatedSqls.push(...result.generatedSqls)
      schemaIssues.push(...result.schemaIssues)
    }

    const completedCount = Math.min(
      i + CONCURRENT_TESTCASE_LIMIT,
      totalTestcases,
    )

    await dispatchProgressEvent(
      {
        completed: completedCount,
        total: totalTestcases,
        message: `Progress: ${completedCount}/${totalTestcases} test cases completed`,
      },
      'qa',
    )
  }

  await dispatchBatchCompleteEvent(
    {
      total: totalTestcases,
      message: `Test case generation complete: ${totalTestcases} test cases processed`,
    },
    'qa',
  )

  return {
    generatedSqls,
    schemaIssues,
  }
}
