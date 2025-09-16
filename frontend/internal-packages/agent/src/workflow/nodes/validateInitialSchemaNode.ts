import { randomUUID } from 'node:crypto'
import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessage } from '@langchain/core/messages'
import { executeQuery } from '@liam-hq/pglite-server'
import { isEmptySchema, postgresqlSchemaDeparser } from '@liam-hq/schema'
import { SSE_EVENTS } from '../../streaming/constants'
import type { WorkflowState } from '../../types'
import { WorkflowTerminationError } from '../../utils/errorHandling'

/**
 * Validates initial schema and provides Instant Database initialization experience.
 * Only runs on first workflow execution.
 */
export async function validateInitialSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  if (isEmptySchema(state.schemaData)) {
    return state
  }

  const ddlResult = postgresqlSchemaDeparser(state.schemaData)

  if (ddlResult.errors.length > 0) {
    const errorMessage = ddlResult.errors
      .map((error) => error.message)
      .join('; ')

    const aiMessage = new AIMessage({
      id: randomUUID(),
      content: '**Instant Database Startup Failed**',
    })

    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, aiMessage)

    throw new WorkflowTerminationError(
      new Error(`Schema deparser failed: ${errorMessage}`),
      'validateInitialSchemaNode',
    )
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

    const aiMessage = new AIMessage({
      id: randomUUID(),
      content: '**Instant Database Startup Failed**',
    })

    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, aiMessage)

    throw new WorkflowTerminationError(
      new Error(`Schema validation failed: ${errorMessage}`),
      'validateInitialSchemaNode',
    )
  }

  return state
}
