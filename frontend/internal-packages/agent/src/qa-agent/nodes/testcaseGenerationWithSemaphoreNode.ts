import type { RunnableConfig } from '@langchain/core/runnables'
import { acquireSemaphore, releaseSemaphore } from '../../utils/progressRuntime'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { testcaseGeneration } from '../testcaseGeneration'

/**
 * Wrapper node that enforces concurrency limit using semaphore
 * - Acquires semaphore before invoking testcaseGeneration subgraph
 * - Releases semaphore after completion (using promise chaining)
 * - This limits concurrent testcase generation to CONCURRENT_TESTCASE_LIMIT
 */
export async function testcaseGenerationWithSemaphoreNode(
  state: QaAgentState,
  config: RunnableConfig,
): Promise<Partial<QaAgentState>> {
  const { batchId } = state

  if (!batchId) {
    return await testcaseGeneration.invoke(state, config)
  }

  await acquireSemaphore(batchId)

  return testcaseGeneration
    .invoke(state, config)
    .then((result) => {
      releaseSemaphore(batchId)
      return result
    })
    .catch((error) => {
      releaseSemaphore(batchId)
      throw error
    })
}
