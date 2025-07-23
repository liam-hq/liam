/**
 * Default error messages for workflow
 */
export const WORKFLOW_ERROR_MESSAGES = {
  EXECUTION_FAILED: 'Workflow execution failed',
  ANSWER_GENERATION_FAILED: 'Failed to generate answer',
  LANGGRAPH_FAILED: 'LangGraph execution failed, falling back to error state',
} as const

/**
 * Retry configuration for workflow operations
 */
export const WORKFLOW_RETRY_CONFIG = {
  /**
   * Maximum number of retries for DDL execution failures
   * When DDL execution fails, the workflow will retry up to this many times
   * by going back to the designSchema node with the error information
   */
  MAX_DDL_EXECUTION_RETRIES: 1,
  /**
   * Maximum number of retries for DML validation failures
   * When DML validation fails, the workflow will retry up to this many times
   * by going back to the prepareDML node with the error information
   */
  MAX_DML_VALIDATION_RETRIES: 1,
} as const
