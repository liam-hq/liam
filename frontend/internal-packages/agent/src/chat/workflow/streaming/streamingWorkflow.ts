import { finalResponseNode } from '../nodes/finalResponseNode'
import { answerGenerationNode } from '../nodes/answerGenerationNode'
import { validationNode } from '../nodes/validationNode'
import type { ResponseChunk, WorkflowState } from '../types'
import {
  createErrorState,
  createFallbackFinalState,
  prepareFinalState,
} from '../services/stateManager'
import { WORKFLOW_ERROR_MESSAGES } from '../constants/progressMessages'

export async function* executeStreamingWorkflow(
  initialState: WorkflowState,
): AsyncGenerator<ResponseChunk, WorkflowState, unknown> {
  let currentState = initialState

  try {
    currentState = await validationNode(currentState)

    if (currentState.error) {
      const errorState = createErrorState(currentState, currentState.error)
      const finalState = prepareFinalState(errorState, initialState)
      
      for await (const chunk of finalResponseNode(finalState)) {
        yield chunk
      }
      return finalState
    }

    currentState = await answerGenerationNode(currentState)

    const finalState = prepareFinalState(currentState, initialState)
    
    const generator = finalResponseNode(finalState)
    let result = await generator.next()
    
    while (!result.done) {
      yield result.value
      result = await generator.next()
    }
    
    return result.value
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED
    const errorState = createErrorState(currentState, errorMessage)
    const fallbackState = createFallbackFinalState(errorState)
    
    yield { type: 'error', content: errorMessage }
    return fallbackState
  }
}
