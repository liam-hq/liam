import { logger, task } from '@trigger.dev/sdk'
import {
  processRepositoryAnalysis,
  type RepositoryAnalysisPayload,
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
