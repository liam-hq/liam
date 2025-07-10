import type { WorkflowState } from '../types'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact'

const NODE_NAME = 'finalizeArtifactsNode'

/**
 * Save artifacts if workflow state contains artifact data
 */
async function saveArtifacts(state: WorkflowState): Promise<void> {
  if (!state.analyzedRequirements && !state.generatedUsecases) {
    state.logger.log(`[${NODE_NAME}] No artifact data available to save`)
    return
  }

  state.logger.log(`[${NODE_NAME}] Saving artifacts`)
  const artifact = transformWorkflowStateToArtifact(state)
  const artifactResult = await createOrUpdateArtifact(state, artifact)

  if (artifactResult.success) {
    state.logger.log(`[${NODE_NAME}] Artifacts saved successfully`)
  } else {
    state.logger.log(
      `[${NODE_NAME}] Failed to save artifacts: ${artifactResult.error}`,
    )
  }
}

/**
 * Save timeline item to database
 */
async function saveTimelineItem(
  state: WorkflowState,
  content: string,
  type: 'error' | 'assistant',
): Promise<void> {
  const saveResult = await state.repositories.schema.createTimelineItem({
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
async function generateFinalResponse(state: WorkflowState): Promise<{
  finalResponse: string
  errorToReturn: Error | undefined
}> {
  if (state.error) {
    const finalResponse = `Sorry, an error occurred during processing: ${state.error.message}`
    await saveTimelineItem(state, finalResponse, 'error')
    return { finalResponse, errorToReturn: state.error }
  }

  if (state.generatedAnswer) {
    await saveTimelineItem(state, state.generatedAnswer, 'assistant')
    return { finalResponse: state.generatedAnswer, errorToReturn: undefined }
  }

  // Fallback case
  const finalResponse =
    'Sorry, we could not generate an answer. Please try again.'
  await saveTimelineItem(state, finalResponse, 'error')
  return {
    finalResponse,
    errorToReturn: new Error('No generated answer available'),
  }
}

/**
 * Finalize Artifacts Node - Generate & Save Artifacts
 * Performed by dbAgentArtifactGen
 */
export async function finalizeArtifactsNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  await saveArtifacts(state)
  const { finalResponse, errorToReturn } = await generateFinalResponse(state)

  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    finalResponse,
    error: errorToReturn,
  }
}
