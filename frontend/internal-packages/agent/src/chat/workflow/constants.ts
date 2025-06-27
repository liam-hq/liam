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
