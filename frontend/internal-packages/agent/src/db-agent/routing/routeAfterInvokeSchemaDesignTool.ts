import type { DbAgentState } from '../shared/dbAgentAnnotation'

/**
 * Determines the next node after invokeSchemaDesignTool execution
 * Routes to END if tool execution was successful, otherwise back to designSchema
 */
export const routeAfterInvokeSchemaDesignTool = (
  state: DbAgentState,
): 'END' | 'designSchema' => {
  // Check the schemaDesignSuccessful flag in state
  // This flag is set by the schemaDesignTool when it successfully updates the schema
  if (state.schemaDesignSuccessful) {
    return 'END'
  }

  // If tool execution failed or returned an error, retry
  return 'designSchema'
}
