import type { AgentName } from '@/lib/langchain'
import type { Schema } from '@liam-hq/db-structure'
import type { WorkflowStepProgress } from './constants/progressMessages'

// Re-export AgentName for use within workflow modules
export type { AgentName }

export type WorkflowMode = 'Ask' | 'Build'

export type WorkflowState = {
  mode?: WorkflowMode
  userInput: string
  generatedAnswer?: string
  finalResponse?: string
  history: string[]
  schemaData?: Schema
  projectId?: string
  error?: string

  // Additional fields for workflow processing
  schemaText?: string
  formattedChatHistory?: string
  agentName?: AgentName

  // Schema update fields
  buildingSchemaId: string
  latestVersionNumber?: number
  organizationId?: string
  userId?: string
}

/**
 * Response chunk type for streaming
 */
export type ResponseChunk = {
  type: 'text' | 'error' | 'progress'
  content: string | WorkflowStepProgress
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
  streaming?: boolean
  recursionLimit?: number
}

/**
 * Result types for workflow steps
 */
type WorkflowStepSuccess = {
  state: WorkflowState
  error?: never
}

type WorkflowStepFailure = {
  error: string
  finalState: WorkflowState
  state?: never
}

export type WorkflowStepResult = WorkflowStepSuccess | WorkflowStepFailure

/**
 * Type guard for workflow step failure
 */
export const isWorkflowStepFailure = (
  result: WorkflowStepResult,
): result is WorkflowStepFailure => {
  return 'error' in result && typeof result.error === 'string'
}

/**
 * Type guard for WorkflowState
 */
export const isWorkflowState = (val: unknown): val is WorkflowState => {
  return (
    val !== null &&
    typeof val === 'object' &&
    'userInput' in val &&
    'history' in val
  )
}
