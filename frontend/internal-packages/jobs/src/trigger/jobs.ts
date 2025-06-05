import type {
  SchemaUpdatePayload,
  SchemaUpdateResult,
} from '@liam-hq/schema-operations'
import { logger, task } from '@trigger.dev/sdk/v3'
import {
  type RepositoryAnalysisPayload,
  processRepositoryAnalysis,
} from '../functions/processRepositoryAnalysis'
import { processSchemaUpdate } from '../functions/processSchemaUpdate'

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

export const updateSchemaTask = task({
  id: 'update-schema',
  run: async (payload: SchemaUpdatePayload): Promise<SchemaUpdateResult> => {
    logger.log('Executing schema update task:', {
      buildingSchemaId: payload.buildingSchemaId,
      operationsCount: payload.patchOperations.length,
      organizationId: payload.organizationId,
    })

    const result = await processSchemaUpdate(payload)

    if (result.success) {
      logger.log('Schema update completed successfully:', {
        buildingSchemaId: payload.buildingSchemaId,
        versionNumber: result.versionNumber,
        operationsApplied: payload.patchOperations.length,
      })
    } else {
      logger.error('Schema update failed:', {
        buildingSchemaId: payload.buildingSchemaId,
        error: result.error,
      })
    }

    return result
  },
})
