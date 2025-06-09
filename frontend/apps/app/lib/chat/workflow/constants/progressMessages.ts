/**
 * Progress data for workflow steps using ProcessIndicator
 */
export const WORKFLOW_STEPS = {
  VALIDATION: {
    id: 'validation',
    title: 'Checking your input...',
    subtitle: 'Validating request parameters and schema',
  },
  ANSWER_GENERATION: {
    id: 'answer_generation',
    title: 'Generating an answer...',
    subtitle: 'Processing your request with AI',
  },
  FINAL_RESPONSE: {
    id: 'final_response',
    title: 'Formatting the final response...',
    subtitle: 'Preparing the response for display',
  },
} as const

type WorkflowStepId = keyof typeof WORKFLOW_STEPS
type WorkflowStepStatus = 'processing' | 'complete' | 'error'

export interface WorkflowStepProgress {
  id: WorkflowStepId
  status: WorkflowStepStatus
  progress?: number
}

/**
 * Default error messages for workflow
 */
export const WORKFLOW_ERROR_MESSAGES = {
  EXECUTION_FAILED: 'Workflow execution failed',
  ANSWER_GENERATION_FAILED: 'Failed to generate answer',
  LANGGRAPH_FAILED: 'LangGraph execution failed, falling back to error state',
} as const
