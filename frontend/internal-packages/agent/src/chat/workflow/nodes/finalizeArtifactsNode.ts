import type { RunnableConfig } from '@langchain/core/runnables'
import type { Repositories } from '../../../repositories/index.ts'
import { getConfigurable } from '../shared/getConfigurable.ts'
import type { WorkflowState } from '../types.ts'

/**
 * Handle workflow errors and save error timeline items
 */
async function handleWorkflowError(
  state: WorkflowState,
  repositories: Repositories,
): Promise<{
  errorToReturn: string | undefined
}> {
  if (state.error) {
    const errorMessage = `Sorry, an error occurred during processing: ${state.error.message}`
    const saveResult = await repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: errorMessage,
      type: 'error',
    })

    if (!saveResult.success) {
      return {
        errorToReturn: `Failed to save error timeline item: ${saveResult.error}`,
      }
    }
    return { errorToReturn: state.error.message }
  }

  // Success case - workflow completed successfully
  return { errorToReturn: undefined }
}

/**
 * Finalize Artifacts Node - Generate & Save Artifacts
 * Performed by dbAgentArtifactGen
 */
export async function finalizeArtifactsNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value
  const { errorToReturn } = await handleWorkflowError(state, repositories)

  return {
    ...state,
    error: errorToReturn ? new Error(errorToReturn) : undefined,
  }
}
