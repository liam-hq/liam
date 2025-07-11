import type { RunnableConfig } from '@langchain/core/runnables'
import type { Repositories } from '../../../repositories'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact'

/**
 * Save artifacts if workflow state contains artifact data
 */
async function saveArtifacts(
  state: WorkflowState,
  repositories: Repositories,
): Promise<void> {
  if (!state.analyzedRequirements && !state.generatedUsecases) {
    return
  }

  await logAssistantMessage(state, repositories, 'Saving artifacts...')
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
    )
  } else {
    await logAssistantMessage(state, repositories, 'Failed to save artifacts')
  }
}

/**
 * Save timeline item to database
 */
async function saveTimelineItem(
  state: WorkflowState,
  content: string,
  type: 'error' | 'assistant',
  repositories: Repositories,
): Promise<void> {
  const saveResult = await repositories.schema.createTimelineItem({
    designSessionId: state.designSessionId,
    content,
    type,
  })

  if (!saveResult.success) {
    console.error(`Failed to save ${type} timeline item:`, saveResult.error)
  }
}

/**
 * Generate final response and determine error state
 */
async function generateFinalResponse(
  state: WorkflowState,
  repositories: Repositories,
): Promise<{
  finalResponse: string
  errorToReturn: string | undefined
}> {
  await logAssistantMessage(state, repositories, 'Generating final response...')

  if (state.error) {
    const finalResponse = `Sorry, an error occurred during processing: ${state.error.message}`
    await saveTimelineItem(state, finalResponse, 'error', repositories)
    return { finalResponse, errorToReturn: state.error.message }
  }

  if (state.generatedAnswer) {
    await logAssistantMessage(
      state,
      repositories,
      'Final response generated successfully',
    )
    await saveTimelineItem(
      state,
      state.generatedAnswer,
      'assistant',
      repositories,
    )
    return { finalResponse: state.generatedAnswer, errorToReturn: undefined }
  }

  // Fallback case
  const finalResponse =
    'Sorry, we could not generate an answer. Please try again.'
  await saveTimelineItem(state, finalResponse, 'error', repositories)
  return { finalResponse, errorToReturn: 'No generated answer available' }
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

  await logAssistantMessage(
    state,
    repositories,
    'Preparing final deliverables...',
  )

  await saveArtifacts(state, repositories)
  const { finalResponse, errorToReturn } = await generateFinalResponse(
    state,
    repositories,
  )

  return {
    ...state,
    finalResponse,
    error: errorToReturn ? new Error(errorToReturn) : undefined,
  }
}
