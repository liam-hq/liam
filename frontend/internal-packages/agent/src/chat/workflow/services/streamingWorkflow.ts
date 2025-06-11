import {
  PROGRESS_MESSAGES,
  WORKFLOW_ERROR_MESSAGES,
} from '../constants/progressMessages'
import { finalResponseNode } from '../nodes'
import { validateInput } from '../shared/langGraphUtils'
import type { ChatState } from '../shared/langGraphUtils'
import { createErrorState, toLangGraphState } from '../shared/stateManager'
import type { ResponseChunk, WorkflowState } from '../types'
import type { BackgroundJobStatus } from '../types'
import { triggerService } from './triggerService'

/**
 * Makes a single API call to check job status
 */
const checkJobStatus = async (jobId: string): Promise<BackgroundJobStatus> => {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3001'
  const response = await fetch(`${baseUrl}/api/jobs/${jobId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Job ${jobId} not found`)
    }
    throw new Error(`API request failed: ${response.status}`)
  }

  return await response.json()
}

/**
 * Handles errors during job status polling
 */
const handlePollingError = async (
  error: unknown,
  pollIntervalMs: number,
): Promise<boolean> => {
  // If it's a timeout error, re-throw it
  if (error instanceof Error && error.message.includes('not found')) {
    throw error
  }

  // For other errors, continue polling after delay
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  return true // Continue polling
}

/**
 * Poll job status via API endpoint instead of in-memory service
 */
const pollJobStatusViaAPI = async (
  jobId: string,
  timeoutMs = 180000, // 3 minutes
  pollIntervalMs = 3000, // 3 seconds
): Promise<BackgroundJobStatus> => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    try {
      const jobStatus = await checkJobStatus(jobId)

      if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
        return jobStatus
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    } catch (error) {
      const shouldContinue = await handlePollingError(error, pollIntervalMs)
      if (!shouldContinue) {
        throw error
      }
    }
  }

  throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`)
}

/**
 * Handles validation logic and returns result
 */
const performValidation = async (
  initialState: WorkflowState,
): Promise<{ validationResult: Partial<ChatState>; error?: string }> => {
  const langGraphState = toLangGraphState(initialState)
  const validationResult = await validateInput(langGraphState)

  if (validationResult.error) {
    return { validationResult, error: validationResult.error }
  }

  return { validationResult }
}

/**
 * Handles trigger job setup and returns job information
 */
const setupTriggerJob = async (
  initialState: WorkflowState,
  validationResult: Partial<ChatState>,
  designSessionId?: string,
): Promise<{
  jobId: string
  triggerJobId?: string
  publicAccessToken?: string
}> => {
  const sessionId = designSessionId || `session_${Date.now()}`

  return await triggerService.triggerAnswerGeneration(
    { ...initialState, ...validationResult },
    sessionId,
  )
}

/**
 * Handles final response streaming
 */
const streamFinalResponse = async function* (
  finalState: WorkflowState,
): AsyncGenerator<ResponseChunk, void, unknown> {
  yield { type: 'custom', content: PROGRESS_MESSAGES.FINAL_RESPONSE.START }

  const finalResponseGenerator = finalResponseNode(finalState, {
    streaming: true,
  })

  for await (const chunk of finalResponseGenerator) {
    if (chunk.type === 'text') {
      yield chunk
    }
  }

  yield {
    type: 'custom',
    content: PROGRESS_MESSAGES.FINAL_RESPONSE.SUCCESS,
  }
}

/**
 * Execute streaming workflow with background job for answer generation
 */
export const executeStreamingWorkflow = async function* (
  initialState: WorkflowState,
  designSessionId?: string,
): AsyncGenerator<ResponseChunk, WorkflowState, unknown> {
  try {
    // Step 1: Input validation
    yield { type: 'custom', content: PROGRESS_MESSAGES.VALIDATION.START }

    const { validationResult, error: validationError } =
      await performValidation(initialState)

    if (validationError) {
      yield { type: 'custom', content: PROGRESS_MESSAGES.VALIDATION.ERROR }
      yield { type: 'error', content: validationError }

      const errorState = createErrorState(initialState, validationError)
      const finalResult = await finalResponseNode(errorState, {
        streaming: false,
      })
      return finalResult
    }

    yield { type: 'custom', content: PROGRESS_MESSAGES.VALIDATION.SUCCESS }

    // Step 2: Trigger background job for answer generation
    yield { type: 'custom', content: PROGRESS_MESSAGES.ANSWER_GENERATION.START }

    const { jobId, triggerJobId, publicAccessToken } = await setupTriggerJob(
      initialState,
      validationResult,
      designSessionId,
    )

    yield { type: 'custom', content: `Background job started: ${jobId}` }

    if (triggerJobId) {
      yield { type: 'custom', content: `Trigger.dev job ID: ${triggerJobId}` }
      yield { type: 'custom', content: `TRIGGER_JOB_ID:${triggerJobId}` }

      if (publicAccessToken) {
        yield {
          type: 'custom',
          content: `PUBLIC_ACCESS_TOKEN:${publicAccessToken}`,
        }
      }

      yield { type: 'custom', content: 'Processing your request...' }
      yield {
        type: 'custom',
        content: 'Monitoring job with Trigger.dev React Hooks...',
      }

      // Return early - client will handle the rest
      return {
        ...initialState,
        ...validationResult,
        triggerJobId,
        generatedAnswer: undefined,
      }
    }

    yield { type: 'custom', content: 'Processing your request...' }

    // Step 3: Fallback polling and completion
    try {
      const jobResult = await pollJobStatusViaAPI(jobId, 180000, 3000)

      if (jobResult.status === 'failed') {
        yield {
          type: 'custom',
          content: PROGRESS_MESSAGES.ANSWER_GENERATION.ERROR,
        }
        yield {
          type: 'error',
          content: jobResult.error || 'Answer generation failed',
        }

        const errorState = createErrorState(
          initialState,
          jobResult.error || 'Answer generation failed',
        )
        const finalResult = await finalResponseNode(errorState, {
          streaming: false,
        })
        return finalResult
      }

      yield {
        type: 'custom',
        content: PROGRESS_MESSAGES.ANSWER_GENERATION.SUCCESS,
      }

      // Create final state with generated answer
      const finalState: WorkflowState = {
        ...initialState,
        ...validationResult,
        generatedAnswer: jobResult.generatedAnswer,
      }

      // Stream the final response
      for await (const chunk of streamFinalResponse(finalState)) {
        yield chunk
      }

      // Get the final result
      const finalResult = await finalResponseNode(finalState, {
        streaming: false,
      })

      return finalResult
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Job processing failed'
      yield {
        type: 'custom',
        content: PROGRESS_MESSAGES.ANSWER_GENERATION.ERROR,
      }
      yield { type: 'error', content: errorMessage }

      const errorState = createErrorState(initialState, errorMessage)
      const finalResult = await finalResponseNode(errorState, {
        streaming: false,
      })
      return finalResult
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    yield { type: 'error', content: errorMessage }

    const errorState = createErrorState(initialState, errorMessage)
    const finalResult = await finalResponseNode(errorState, {
      streaming: false,
    })
    return finalResult
  }
}
