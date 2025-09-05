import type { RunnableConfig } from '@langchain/core/runnables'
import { executeQuery } from '@liam-hq/pglite-server'
import { postgresqlSchemaDeparser, schemaSchema } from '@liam-hq/schema'
import * as v from 'valibot'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { WorkflowTerminationError } from '../../shared/errorHandling'

/**
 * Validates initial schema and provides Instant Database initialization experience.
 * Only runs on first workflow execution.
 */
export async function validateInitialSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'validateInitialSchemaNode',
    )
  }

  const { repositories } = configurableResult.value

  const buildingSchemaResult = await repositories.schema.getBuildingSchemaData(
    state.designSessionId,
  )
  if (buildingSchemaResult.isErr()) {
    throw new WorkflowTerminationError(
      buildingSchemaResult.error,
      'validateInitialSchemaNode',
    )
  }

  const { buildingSchema } = buildingSchemaResult.value
  const initialSchemaSnapshot = buildingSchema.initial_schema_snapshot

  if (!initialSchemaSnapshot) {
    // TODO: Add message for fresh environment
    return state
  }

  const schemaValidationResult = v.safeParse(
    schemaSchema,
    initialSchemaSnapshot,
  )
  if (!schemaValidationResult.success) {
    const validationErrors = schemaValidationResult.issues
      .map((issue) => `- ${issue.path?.join('.')}: ${issue.message}`)
      .join('\n')
    const detailedError = new Error(
      `Initial schema validation failed:\n\nSchema structure validation failed:\n${validationErrors}\n\nPlease review and fix your schema before retrying.`,
    )
    throw new WorkflowTerminationError(
      detailedError,
      'validateInitialSchemaNode',
    )
  }

  const schema = schemaValidationResult.output

  // Check if schema is essentially empty (no tables)
  if (Object.keys(schema.tables || {}).length === 0) {
    // TODO: Add message for fresh environment
    return state
  }

  const deparseResult = postgresqlSchemaDeparser(schema)

  if (deparseResult.errors.length > 0) {
    const errorDetails = deparseResult.errors
      .map((err) => `- ${err.message}`)
      .join('\n')
    const detailedError = new Error(
      `Initial schema validation failed:\n\nSchema structure validation failed:\n${errorDetails}\n\nPlease review and fix your schema before retrying.`,
    )
    throw new WorkflowTerminationError(
      detailedError,
      'validateInitialSchemaNode',
    )
  }

  const ddlStatements = deparseResult.value
  if (!ddlStatements) {
    const detailedError = new Error(
      'Initial schema validation failed:\n\nSchema appears to be empty or invalid - no DDL generated\n\nPlease review and fix your schema before retrying.',
    )
    throw new WorkflowTerminationError(
      detailedError,
      'validateInitialSchemaNode',
    )
  }

  const requiredExtensions = Object.keys(schema.extensions || {})

  const executionResults = await executeQuery(ddlStatements, requiredExtensions)
  const hasErrors = executionResults.some((result) => !result.success)

  if (hasErrors) {
    const failedResults = executionResults.filter((result) => !result.success)

    // Build detailed error message
    const errorDetails = failedResults
      .slice(0, 3)
      .map((result) => {
        const error =
          typeof result.result === 'object' &&
          result.result !== null &&
          'error' in result.result
            ? String(result.result.error)
            : String(result.result)
        return `- SQL: ${result.sql}\n  Error: ${error}`
      })
      .join('\n')

    const detailedError = new Error(
      `Initial schema validation failed:\n\nDDL execution failed:\n- Successful: ${executionResults.filter((r) => r.success).length} statements\n- Failed: ${failedResults.length} statements\n\nError details:\n${errorDetails}\n\nPlease review and fix your schema to use PostgreSQL-compatible syntax.`,
    )
    throw new WorkflowTerminationError(
      detailedError,
      'validateInitialSchemaNode',
    )
  }

  // TODO: Add success message for existing schema
  return state
}
