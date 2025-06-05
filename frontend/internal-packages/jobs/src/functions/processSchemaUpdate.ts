import {
  type SchemaUpdatePayload,
  type SchemaUpdateResult,
  createNewVersionSimple,
} from '@liam-hq/schema-operations'
import { logger } from '@trigger.dev/sdk/v3'
import { createClient } from '../libs/supabase'

/**
 * Get error message from any error type
 */
const getErrorMessage = (error: unknown, context: string): string => {
  return `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
}

/**
 * Validate schema update payload
 */
const validatePayload = (payload: SchemaUpdatePayload): void => {
  if (!payload.buildingSchemaId) {
    throw new Error('buildingSchemaId is required')
  }
  if (!payload.organizationId) {
    throw new Error('organizationId is required')
  }
  if (!Array.isArray(payload.patchOperations)) {
    throw new Error('patchOperations must be an array')
  }
  if (typeof payload.latestVersionNumber !== 'number') {
    throw new Error('latestVersionNumber must be a number')
  }
}

/**
 * Verify user has permission to update the schema
 */
const verifyPermissions = async (
  buildingSchemaId: string,
  organizationId: string,
): Promise<boolean> => {
  try {
    const supabase = createClient()

    const { data: buildingSchema, error } = await supabase
      .from('building_schemas')
      .select('organization_id')
      .eq('id', buildingSchemaId)
      .maybeSingle()

    if (error) {
      logger.error('Failed to verify schema permissions:', {
        error: error.message,
      })
      return false
    }

    if (!buildingSchema) {
      logger.error('Building schema not found:', { buildingSchemaId })
      return false
    }

    return buildingSchema.organization_id === organizationId
  } catch (error) {
    logger.error('Permission verification failed:', {
      error: getErrorMessage(error, 'Permission check'),
    })
    return false
  }
}

/**
 * Log schema update activity
 */
const logSchemaActivity = async (
  buildingSchemaId: string,
  userMessage: string,
  versionNumber: number,
  organizationId: string,
  userId?: string,
): Promise<void> => {
  try {
    // Note: This assumes there's an activity log table
    // If it doesn't exist, this can be removed or modified
    logger.log('Schema update activity:', {
      buildingSchemaId,
      userMessage: userMessage.substring(0, 100), // Truncate for logging
      versionNumber,
      organizationId,
      userId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Don't fail the main process if logging fails
    logger.warn('Failed to log schema activity:', {
      error: getErrorMessage(error, 'Activity logging'),
    })
  }
}

/**
 * Process schema update with patch operations
 */
export const processSchemaUpdate = async (
  payload: SchemaUpdatePayload,
): Promise<SchemaUpdateResult> => {
  const {
    buildingSchemaId,
    latestVersionNumber,
    patchOperations,
    userMessage,
    organizationId,
    userId,
  } = payload

  logger.log('🔧 Processing schema update:', {
    buildingSchemaId,
    latestVersionNumber,
    operationsCount: patchOperations.length,
    organizationId,
  })

  try {
    // 1. Validate payload
    validatePayload(payload)

    // 2. Verify permissions
    const hasPermission = await verifyPermissions(
      buildingSchemaId,
      organizationId,
    )
    if (!hasPermission) {
      throw new Error('Insufficient permissions to update schema')
    }

    // 3. Skip if no operations to apply
    if (patchOperations.length === 0) {
      logger.log('No schema changes to apply')
      return {
        success: true,
        versionNumber: latestVersionNumber,
      }
    }

    // 4. Apply schema changes using shared createNewVersionSimple function
    const supabase = createClient()
    const updateResult = await createNewVersionSimple(supabase, {
      buildingSchemaId,
      latestVersionNumber,
      patch: patchOperations,
    })

    if (!updateResult.success) {
      logger.error('Schema update failed:', { error: updateResult.error })
      return {
        success: false,
        error: updateResult.error || 'Unknown error during schema update',
      }
    }

    // 5. Log activity (assuming version number is latestVersionNumber + 1)
    const newVersionNumber = latestVersionNumber + 1
    await logSchemaActivity(
      buildingSchemaId,
      userMessage,
      newVersionNumber,
      organizationId,
      userId,
    )

    logger.log('✅ Schema update completed successfully:', {
      buildingSchemaId,
      newVersionNumber,
      operationsApplied: patchOperations.length,
    })

    return {
      success: true,
      versionNumber: newVersionNumber,
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Schema update failed')
    logger.error(errorMessage, {
      buildingSchemaId,
      latestVersionNumber,
      organizationId,
    })

    return {
      success: false,
      error: errorMessage,
    }
  }
}
