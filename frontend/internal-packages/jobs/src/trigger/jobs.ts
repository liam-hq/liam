import { logger, task } from '@trigger.dev/sdk/v3'
import {
  type AnswerGenerationPayload,
  processAnswerGeneration,
} from '../functions/processAnswerGeneration'
import {
  type RepositoryAnalysisPayload,
  processRepositoryAnalysis,
} from '../functions/processRepositoryAnalysis'

export const analyzeRepositoryTask = task({
  id: 'analyze-repository',
  run: async (payload: RepositoryAnalysisPayload) => {
    logger.log('Executing repository analysis task:', { payload })

    const result = await processRepositoryAnalysis(payload)

    logger.log('Repository analysis completed:', {
      processedFiles: result.processedFiles,
      errorCount: result.errors.length,
    })

    if (result.errors.length > 0) {
      logger.warn('Repository analysis completed with errors:', {
        errors: result.errors,
      })
    }

    return result
  },
})

export const generateAnswerTask = task({
  id: 'generate-answer',
  run: async (payload: AnswerGenerationPayload) => {
    logger.log('Executing answer generation task:', {
      jobId: payload.jobId,
      designSessionId: payload.designSessionId,
    })

    try {
      // Execute the actual processing
      const result = await processAnswerGeneration(payload)

      logger.log('Answer generation task completed:', {
        jobId: result.jobId,
        success: result.success,
        hasAnswer: !!result.generatedAnswer,
        hasError: !!result.error,
      })

      return result
    } catch (error) {
      logger.error('Answer generation task failed:', {
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Re-throw the error
      throw error
    }
  },
})
