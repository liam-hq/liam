import { executeQuery } from '@liam-hq/pglite-server'
import { isEmptySchema, postgresqlSchemaDeparser } from '@liam-hq/schema'
import type { WorkflowState } from '../../types'
import { WorkflowTerminationError } from '../../utils/errorHandling'

const createValidationError = (
  error: Error | string,
): WorkflowTerminationError => {
  const errorInstance = error instanceof Error ? error : new Error(error)
  return new WorkflowTerminationError(
    errorInstance,
    'validateInitialSchemaNode',
  )
}

/**
 * Validates initial schema and provides Instant Database initialization experience.
 * Only runs on first workflow execution.
 */
export async function validateInitialSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  if (isEmptySchema(state.schemaData)) {
    // TODO: Add message creation in next PR
    return state
  }

  const ddlResult = postgresqlSchemaDeparser(state.schemaData)

  if (ddlResult.errors.length > 0) {
    const errorMessage = ddlResult.errors
      .map((error) => error.message)
      .join('; ')
    throw createValidationError(`Schema deparser failed: ${errorMessage}`)
  }

  const ddlStatements = ddlResult.value
  const requiredExtensions = Object.keys(
    state.schemaData.extensions || {},
  ).sort()

  const validationResults = await executeQuery(
    ddlStatements,
    requiredExtensions,
  )
  const hasErrors = validationResults.some((result) => !result.success)

  if (hasErrors) {
    const errorResult = validationResults.find((result) => !result.success)
    const errorMessage = JSON.stringify(errorResult?.result)
    throw createValidationError(`Schema validation failed: ${errorMessage}`)
  }

  // TODO: Add message creation in next PR
  return state
}
