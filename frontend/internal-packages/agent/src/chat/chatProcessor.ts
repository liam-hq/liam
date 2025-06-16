import type { Schema } from '@liam-hq/db-structure'
import type { Repositories } from '../repositories'
import { executeChatWorkflow } from './workflow'
import type { WorkflowState } from './workflow/types'

export interface ChatProcessorParams {
  message: string
  schemaData: Schema
  history: [string, string][]
  organizationId?: string
  buildingSchemaId: string
  latestVersionNumber?: number
  repositories: Repositories
  designSessionId: string
  userId: string
}

export type ChatProcessorResult =
  | {
      text: string
      success: true
    }
  | {
      success: false
      error: string | undefined
    }

/**
 * Process chat message
 */
export const processChatMessage = async (
  params: ChatProcessorParams,
): Promise<ChatProcessorResult> => {
  const {
    message,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    repositories,
    designSessionId,
    userId,
  } = params

  // Save user message to database
  const saveResult = await repositories.schema.createMessage({
    designSessionId,
    content: message,
    role: 'user',
    userId,
  })

  if (!saveResult.success) {
    console.error('Failed to save user message:', saveResult.error)
    return {
      success: false,
      error: saveResult.error,
    }
  }

  // Convert history format
  const formattedHistory = history.map(([, content]) => content)

  // Create progress callback for real-time updates
  const onProgress = (progressMessage: string) => {
    repositories.progress.sendProgressMessage({
      designSessionId,
      message: progressMessage,
    }).catch((error) => {
      console.error('Failed to send progress message:', error)
    })
  }

  // Create workflow state
  const workflowState: WorkflowState = {
    userInput: message,
    history: formattedHistory,
    schemaData,
    organizationId,
    buildingSchemaId,
    latestVersionNumber,
    repositories,
    designSessionId,
    userId,
    onProgress,
  }

  // Execute workflow
  const result = await executeChatWorkflow(workflowState)

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
}
