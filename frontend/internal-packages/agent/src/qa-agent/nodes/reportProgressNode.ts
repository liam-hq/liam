import type { RunnableConfig } from '@langchain/core/runnables'
import { incrementCompleted } from '../../utils/progressRuntime'
import { dispatchProgressEvent } from '../../utils/progressTracking'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

/**
 * Report progress after each testcase generation completes
 * - Increments completed counter in runtime state
 * - Dispatches PROGRESS event with current completed/total
 * - Runs after each successful testcaseGeneration
 */
export async function reportProgressNode(
  state: QaAgentState,
  _config: RunnableConfig,
): Promise<Partial<QaAgentState>> {
  const { batchId } = state

  if (!batchId) {
    return {}
  }

  const progress = incrementCompleted(batchId)

  if (!progress) {
    return {}
  }

  await dispatchProgressEvent(
    {
      completed: progress.completed,
      total: progress.total,
      message: `Progress: ${progress.completed}/${progress.total} test cases completed`,
    },
    'qa',
  )

  return {}
}
