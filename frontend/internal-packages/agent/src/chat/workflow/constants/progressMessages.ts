export const WORKFLOW_ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation step failed',
  ANSWER_GENERATION_FAILED: 'Answer generation failed',
  FINAL_RESPONSE_FAILED: 'Final response generation failed',
  LANGGRAPH_FAILED: 'LangGraph workflow execution failed',
  EXECUTION_FAILED: 'Workflow execution failed',
  STREAMING_FAILED: 'Streaming workflow failed',
} as const

export const WORKFLOW_PROGRESS_MESSAGES = {
  VALIDATING_INPUT: 'Validating input...',
  GENERATING_ANSWER: 'Generating answer...',
  FORMATTING_RESPONSE: 'Formatting response...',
  COMPLETED: 'Completed successfully',
} as const
