import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'executeDdlNode'

/**
 * Execute DDL Node - Generates DDL from schema (execution deferred to validateSchemaNode)
 * Generates DDL mechanically without LLM, execution happens later with DML
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
  // TODO: Remove this detailed logging once the feature is stable and working properly
  const tableCount = Object.keys(state.schemaData.tables).length
  const ddlLength = ddlStatements.length

  state.logger.log(
    `[${NODE_NAME}] Generated DDL for ${tableCount} tables (${ddlLength} characters)`,
  )
  state.logger.debug(`[${NODE_NAME}] Generated DDL:`, { ddlStatements })

  // Note: DDL execution is deferred to validateSchemaNode for combined DDL+DML execution
  state.logger.log(
    `[${NODE_NAME}] DDL generation completed, execution deferred to validateSchemaNode`,
  )
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    ddlStatements,
  }
}
