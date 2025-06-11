import type { Schema } from '@liam-hq/db-structure'
import { executeChatWorkflow } from './workflow'
import type { WorkflowState } from './workflow/types'

interface ChatProcessorParams {
  message: string
  schemaData: Schema
  history?: [string, string][]
  organizationId?: string
  buildingSchemaId: string
  latestVersionNumber?: number
}

type ChatProcessorResult =
  | {
      text: string
      success: true
    }
  | {
      success: false
      error: string | undefined
    }

// streaming mode
export function processChatMessage(
  params: ChatProcessorParams,
  options?: { streaming?: true },
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom' | 'trigger_job_id'; content: string },
  ChatProcessorResult,
  unknown
>

// non-streaming mode
export function processChatMessage(
  params: ChatProcessorParams,
  options: { streaming: false },
): Promise<ChatProcessorResult>

// implementation
export function processChatMessage(
  params: ChatProcessorParams,
  options: { streaming?: boolean } = { streaming: true },
):
  | Promise<ChatProcessorResult>
  | AsyncGenerator<
      { type: 'text' | 'error' | 'custom' | 'trigger_job_id'; content: string },
      ChatProcessorResult,
      unknown
    > {
  const streaming = options.streaming ?? true

  if (streaming) {
    return processChatMessageStreaming(params)
  }

  return processChatMessageSync(params)
}

// non-streaming implementation using workflow
async function processChatMessageSync(
  params: ChatProcessorParams,
): Promise<ChatProcessorResult> {
  const {
    message,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
  } = params

  try {
    // Convert history format
    const formattedHistory = history?.map(([, content]) => content) || []

    // Create workflow state
    const workflowState: WorkflowState = {
      userInput: message,
      history: formattedHistory,
      schemaData,
      organizationId,
      buildingSchemaId,
      latestVersionNumber,
    }

    // Execute workflow without streaming
    const result = await executeChatWorkflow(workflowState, {
      streaming: false,
    })

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      text: result.finalResponse || result.generatedAnswer || '',
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process streaming chunks and accumulate results
 */
async function* processStreamingChunks(
  stream: AsyncGenerator<
    { type: 'text' | 'error' | 'custom' | 'trigger_job_id'; content: string },
    unknown,
    unknown
  >,
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom' | 'trigger_job_id'; content: string },
  { finalText: string; hasError: boolean; errorMessage: string },
  unknown
> {
  let finalText = ''
  let hasError = false
  let errorMessage = ''

  for await (const chunk of stream) {
    if (chunk.type === 'text') {
      finalText += chunk.content
      yield chunk
    } else if (chunk.type === 'custom' || chunk.type === 'trigger_job_id') {
      yield chunk
    } else if (chunk.type === 'error') {
      hasError = true
      errorMessage = chunk.content
      yield chunk
    }
  }

  return { finalText, hasError, errorMessage }
}

// streaming implementation using workflow
async function* processChatMessageStreaming(
  params: ChatProcessorParams,
): AsyncGenerator<
  { type: 'text' | 'error' | 'custom' | 'trigger_job_id'; content: string },
  ChatProcessorResult,
  unknown
> {
  const {
    message,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
  } = params

  try {
    // Convert history format
    const formattedHistory = history?.map(([, content]) => content) || []

    // Create workflow state
    const workflowState: WorkflowState = {
      userInput: message,
      history: formattedHistory,
      schemaData,
      organizationId,
      buildingSchemaId,
      latestVersionNumber,
    }

    // Execute workflow with streaming
    const stream = executeChatWorkflow(workflowState, { streaming: true })

    // Process streaming chunks
    const result = yield* processStreamingChunks(stream)

    // Return the complete result
    return {
      text: result.finalText,
      success: !result.hasError,
      error: result.hasError ? result.errorMessage : undefined,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    yield { type: 'error', content: errorMsg }
    return {
      success: false,
      error: errorMsg,
    }
  }
}
