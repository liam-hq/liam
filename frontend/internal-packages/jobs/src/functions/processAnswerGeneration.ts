import { logger } from '@trigger.dev/sdk/v3'
import { answerGenerationNodeBackground } from '../../../agent/src/chat/workflow/nodes/answerGenerationNodeBackground'
import type { WorkflowState } from '../../../agent/src/chat/workflow/types'

export interface AnswerGenerationPayload
  extends Omit<WorkflowState, 'generatedAnswer' | 'finalResponse' | 'error'> {
  // Job tracking
  jobId: string
  designSessionId: string
}

export interface AnswerGenerationResult {
  jobId: string
  success: boolean
  generatedAnswer?: string | undefined
  error?: string | undefined
  processedAt: string
}

/**
 * Process answer generation in background
 */
export const processAnswerGeneration = async (
  payload: AnswerGenerationPayload,
): Promise<AnswerGenerationResult> => {
  const startTime = Date.now()

  try {
    logger.log('Starting answer generation process', {
      jobId: payload.jobId,
      userInput: `${payload.userInput.substring(0, 100)}...`,
    })

    // Create state object for answerGenerationNode
    const state = {
      userInput: payload.userInput,
      history: payload.history,
      schemaData: payload.schemaData,
      projectId: payload.projectId,
      buildingSchemaId: payload.buildingSchemaId,
      latestVersionNumber: payload.latestVersionNumber,
      organizationId: payload.organizationId,
      userId: payload.userId,
      schemaText: payload.schemaText,
      formattedChatHistory: payload.formattedChatHistory,
      agentName: payload.agentName,
    }

    // Execute answer generation
    const result = await answerGenerationNodeBackground(state)

    const processingTime = Date.now() - startTime

    if (result.error) {
      logger.error('Answer generation failed', {
        jobId: payload.jobId,
        error: result.error,
        processingTime,
      })

      return {
        jobId: payload.jobId,
        success: false,
        error: result.error,
        processedAt: new Date().toISOString(),
      }
    }

    logger.log('Answer generation completed successfully', {
      jobId: payload.jobId,
      answerLength: result.generatedAnswer?.length || 0,
      processingTime,
    })

    return {
      jobId: payload.jobId,
      success: true,
      generatedAnswer: result.generatedAnswer,
      processedAt: new Date().toISOString(),
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    logger.error('Answer generation process failed with exception', {
      jobId: payload.jobId,
      error: errorMessage,
      processingTime,
    })

    return {
      jobId: payload.jobId,
      success: false,
      error: errorMessage,
      processedAt: new Date().toISOString(),
    }
  }
}
