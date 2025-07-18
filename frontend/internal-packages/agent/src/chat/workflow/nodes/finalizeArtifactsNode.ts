import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import type { Repositories } from '../../../repositories/index.ts'
import { getConfigurable } from '../shared/getConfigurable.ts'
import type { WorkflowState } from '../types.ts'
import { logAssistantMessage } from '../utils/timelineLogger.ts'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact.ts'

/**
 * Save artifacts if workflow state contains artifact data
 */
async function saveArtifacts(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<void> {
  if (!state.analyzedRequirements && !state.generatedUsecases) {
    return
  }

  await logAssistantMessage(
    state,
    repositories,
    'Saving artifacts...',
    assistantRole,
  )
  const artifact = transformWorkflowStateToArtifact(state)
  const artifactResult = await createOrUpdateArtifact(
    state,
    artifact,
    repositories,
  )

  if (artifactResult.success) {
    await logAssistantMessage(
      state,
      repositories,
      'Artifacts saved successfully',
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Failed to save artifacts',
      assistantRole,
    )
  }
}

/**
 * Handle workflow errors and save error timeline items
 */
async function handleWorkflowError(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<{
  errorToReturn: string | undefined
}> {
  await logAssistantMessage(
    state,
    repositories,
    'Handling workflow completion...',
    assistantRole,
  )

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
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Preparing final deliverables...',
    assistantRole,
  )

  await saveArtifacts(state, repositories, assistantRole)
  const { errorToReturn } = await handleWorkflowError(
    state,
    repositories,
    assistantRole,
  )

  return {
    ...state,
    error: errorToReturn ? new Error(errorToReturn) : undefined,
  }
}
