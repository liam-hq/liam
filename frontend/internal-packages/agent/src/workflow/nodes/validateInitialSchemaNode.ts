import { END } from '@langchain/langgraph'
import { executeQuery } from '@liam-hq/pglite-server'
import { isEmptySchema, postgresqlSchemaDeparser } from '@liam-hq/schema'
import type { WorkflowState } from '../../types'

/**
 * Validates initial schema and provides Instant Database initialization experience.
 * Only runs on first workflow execution.
 */
export async function validateInitialSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  if (isEmptySchema(state.schemaData)) {
    // No validation needed for empty schema, continue to leadAgent
    return state
  }

  const ddlResult = postgresqlSchemaDeparser(state.schemaData)

  if (ddlResult.errors.length > 0) {
    // TODO: Add error messages to state
    return {
      ...state,
      messages: [...state.messages],
      next: END,
    }
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
    // TODO: Add error message to state
    return {
      ...state,
      messages: [...state.messages],
      next: END,
    }
  }

  // Schema validation successful, continue to leadAgent
  return state
}
