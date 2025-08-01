import type { RunnableConfig } from '@langchain/core/runnables'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'

/**
 * Finalize Artifacts Node - Generate & Save Artifacts
 * Performed by dbAgentArtifactGen
 * Note: Error handling is now done immediately at error occurrence, not here
 */
export async function finalizeArtifactsNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'finalizeArtifactsNode',
    )
  }

  // Success case - workflow completed successfully
  return state
}
