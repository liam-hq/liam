import { executeQuery } from '@liam-hq/pglite-server'
import { isEmptySchema, postgresqlSchemaDeparser } from '@liam-hq/schema'
import { ResultAsync } from 'neverthrow'
import type { WorkflowState } from '../../chat/workflow/types'
import { WorkflowTerminationError } from '../../shared/errorHandling'

const createValidationError = (message: string): WorkflowTerminationError => {
  return new WorkflowTerminationError(
    new Error(message),
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
    const errorMessage = ddlResult.errors.join('; ')
    throw createValidationError(`Schema deparser failed: ${errorMessage}`)
  }

  const ddlStatements = ddlResult.value
  const requiredExtensions = Object.keys(
    state.schemaData.extensions || {},
  ).sort()

  return await ResultAsync.fromPromise(
    executeQuery(ddlStatements, requiredExtensions),
    (error) => new Error(String(error)),
  ).match(
    (validationResults) => {
      const hasErrors = validationResults.some((result) => !result.success)

      if (hasErrors) {
        const errorResult = validationResults.find((result) => !result.success)
        const errorMessage = JSON.stringify(errorResult?.result)
        throw createValidationError(`Schema validation failed: ${errorMessage}`)
      }

      // TODO: Add message creation in next PR
      return state
    },
    (error) => {
      throw createValidationError(
        `Schema validation execution failed: ${error.message}`,
      )
    },
  )
}
