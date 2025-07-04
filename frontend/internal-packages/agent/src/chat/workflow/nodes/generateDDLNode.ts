import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'generateDDLNode'

/**
 * Generate DDL Node - Uses existing schema deparser for DDL generation
 * Generates DDL mechanically without LLM
 */
export async function generateDDLNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    state.logger.log(`[${NODE_NAME}] Started`)

    // Update progress message if available
    if (state.progressTimelineItemId) {
      await state.repositories.schema.updateTimelineItem(
        state.progressTimelineItemId,
        {
          content: 'Processing: generateDDL',
          progress: getWorkflowNodeProgress('generateDDL'),
        },
      )
    }

    const result = postgresqlSchemaDeparser(state.schemaData)
    const ddlStatements = result.value

    // Log detailed information about what was generated
    // TODO: Remove this detailed logging once the feature is stable and working properly
    const tableCount = Object.keys(state.schemaData.tables).length
    const ddlLength = ddlStatements.length

    state.logger.log(
      `[${NODE_NAME}] Generated DDL for ${tableCount} tables (${ddlLength} characters)`,
    )
    state.logger.debug(`[${NODE_NAME}] Generated DDL:`, { ddlStatements })
    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      ddlStatements,
    }
  } catch (error) {
    state.logger.log(`[${NODE_NAME}] Failed: ${error}`)

    return {
      ...state,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }
}
