import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'executeDdlNode'

/**
 * Execute DDL Node - Generates DDL from schema and executes it
 * Generates DDL mechanically without LLM and then executes
 */
export async function executeDdlNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: executeDDL',
        progress: getWorkflowNodeProgress('executeDDL'),
      },
    )
  }

  // Generate DDL from schema data
  const result = postgresqlSchemaDeparser(state.schemaData)

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join('; ')
    state.logger.log(`[${NODE_NAME}] DDL generation failed: ${errorMessages}`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }

  const ddlStatements = result.value

  // Log detailed information about what was generated
  const tableCount = Object.keys(state.schemaData.tables).length
  const ddlLength = ddlStatements.length

  state.logger.log(
    `[${NODE_NAME}] Generated DDL for ${tableCount} tables (${ddlLength} characters)`,
  )
  state.logger.debug(`[${NODE_NAME}] Generated DDL:`, { ddlStatements })

  if (!ddlStatements || !ddlStatements.trim()) {
    state.logger.log(`[${NODE_NAME}] No DDL statements to execute`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
      ddlStatements,
    }
  }

  const results: SqlResult[] = await executeQuery(
    state.designSessionId,
    ddlStatements,
  )

  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    state.logger.log(`[${NODE_NAME}] DDL execution failed: ${errorMessages}`)
    state.logger.log(`[${NODE_NAME}] Completed`)
    return {
      ...state,
    }
  }

  state.logger.log(`[${NODE_NAME}] DDL executed successfully`)
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    ddlStatements,
  }
}
