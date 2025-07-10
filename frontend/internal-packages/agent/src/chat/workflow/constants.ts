/**
 * Default error messages for workflow
 */
export const WORKFLOW_ERROR_MESSAGES = {
  EXECUTION_FAILED: 'Workflow execution failed',
  ANSWER_GENERATION_FAILED: 'Failed to generate answer',
  LANGGRAPH_FAILED: 'LangGraph execution failed, falling back to error state',
} as const

/**
 * Progress mapping for LangGraph workflow nodes
 * Each node is assigned a progress percentage that represents
 * how much of the overall workflow has been completed when that node finishes
 */
export const WORKFLOW_NODE_PROGRESS = {
  createProgressMessage: 10,
  analyzeRequirements: 20,
  designSchema: 30,
  generateDDL: 40,
  executeDDL: 50,
  generateUsecase: 60,
  prepareDML: 70,
  validateSchema: 80,
  reviewDeliverables: 90,
  finalizeArtifacts: 100,
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
   * Maximum number of retries for DML execution failures
   * When DML execution fails with retryable errors, the workflow will retry
   */
  MAX_DML_EXECUTION_RETRIES: 1,
} as const
