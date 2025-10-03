import type { WorkflowState } from '../../types'

export function isQACompleted(state: WorkflowState): boolean {
  return state.testcases.length > 0
}

function hasSchemaIssues(state: WorkflowState): boolean {
  return state.schemaIssues.length > 0
}

export function shouldRouteDBAgent(state: WorkflowState): boolean {
  return hasSchemaIssues(state)
}
