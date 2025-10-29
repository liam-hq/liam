import type { RunnableConfig } from '@langchain/core/runnables'
import { initBatch } from '../../utils/progressRuntime'
import { dispatchBatchStartEvent } from '../../utils/progressTracking'
import { getUnprocessedRequirements } from '../distributeRequirements/getUnprocessedRequirements'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

/**
 * Prepare testcases for parallel processing with Send API
 * - Computes list of unprocessed testcases
 * - Generates unique batchId for this run
 * - Initializes progress tracking and semaphore
 * - Dispatches BATCH_START event
 */
export async function prepareTestcasesNode(
  state: QaAgentState,
  _config: RunnableConfig,
): Promise<Partial<QaAgentState>> {
  const targetTestcases = getUnprocessedRequirements(state)
  const totalTestcases = targetTestcases.length

  if (totalTestcases === 0) {
    return {}
  }

  const batchId = crypto.randomUUID()

  initBatch(batchId, totalTestcases)

  await dispatchBatchStartEvent(
    {
      total: totalTestcases,
      message: `Starting test case generation: processing ${totalTestcases} requirements...`,
    },
    'qa',
  )

  return {
    batchId,
    totalTestcases,
  }
}
