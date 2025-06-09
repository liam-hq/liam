import {
  WORKFLOW_ERROR_MESSAGES,
  type WorkflowStepProgress,
} from '../constants/progressMessages'
import { finalResponseNode } from '../nodes'
import { createErrorState } from '../services/stateManager'
import {
  executeAnswerGeneration,
  executeValidation,
  extractFinalState,
  prepareFinalResponseGenerator,
} from '../services/workflowSteps'
import type { ResponseChunk, WorkflowState } from '../types'

/**
 * Execute streaming workflow
 */
export const executeStreamingWorkflow = async function* (
  initialState: WorkflowState,
): AsyncGenerator<ResponseChunk, WorkflowState, unknown> {
  try {
    // Step 1: Validation
    yield {
      type: 'progress',
      content: {
        id: 'VALIDATION',
        status: 'processing',
      } as WorkflowStepProgress,
    }
    const validationResult = await executeValidation(initialState)

    // Import type guard
    const { isWorkflowStepFailure } = await import('../types')

    if (isWorkflowStepFailure(validationResult)) {
      yield {
        type: 'progress',
        content: {
          id: 'VALIDATION',
          status: 'error',
        } as WorkflowStepProgress,
      }
      yield { type: 'error', content: validationResult.error }
      return validationResult.finalState
    }

    yield {
      type: 'progress',
      content: {
        id: 'VALIDATION',
        status: 'complete',
      } as WorkflowStepProgress,
    }

    // Step 2: Answer Generation (preparation only)
    yield {
      type: 'progress',
      content: {
        id: 'ANSWER_GENERATION',
        status: 'processing',
      } as WorkflowStepProgress,
    }
    const answerResult = await executeAnswerGeneration(validationResult.state)

    if (isWorkflowStepFailure(answerResult)) {
      yield {
        type: 'progress',
        content: {
          id: 'ANSWER_GENERATION',
          status: 'error',
        } as WorkflowStepProgress,
      }
      yield { type: 'error', content: answerResult.error }
      return answerResult.finalState
    }

    // Step 3: Final Response (actual AI generation happens here)
    yield {
      type: 'progress',
      content: {
        id: 'FINAL_RESPONSE',
        status: 'processing',
      } as WorkflowStepProgress,
    }

    // Stream the final response
    const { finalState, generator } = prepareFinalResponseGenerator(
      answerResult.state,
      initialState,
    )

    let hasStreamedContent = false

    for await (const chunk of generator) {
      if (chunk.type === 'text' || chunk.type === 'error') {
        // Mark answer generation as complete when we start getting actual content
        if (!hasStreamedContent) {
          yield {
            type: 'progress',
            content: {
              id: 'ANSWER_GENERATION',
              status: 'complete',
            } as WorkflowStepProgress,
          }
          hasStreamedContent = true
        }
        yield chunk
      }
    }

    // Mark formatting as complete only after all streaming is done
    yield {
      type: 'progress',
      content: {
        id: 'FINAL_RESPONSE',
        status: 'complete',
      } as WorkflowStepProgress,
    }

    // Get final state from generator
    const finalResult = await extractFinalState(generator, finalState)
    return finalResult
  } catch (error) {
    console.error(WORKFLOW_ERROR_MESSAGES.LANGGRAPH_FAILED, error)

    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    yield { type: 'error', content: errorMessage }

    // Even with catch error, go through finalResponseNode to ensure proper response
    const errorState = createErrorState(initialState, errorMessage)
    const finalResult = await finalResponseNode(errorState, {
      streaming: false,
    })
    return finalResult
  }
}
