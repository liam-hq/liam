import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import type { WorkflowState } from './chat/workflow/types'

/**
 * Parameters for agent workflow execution
 */
export type AgentWorkflowParams = {
  userInput: string
  schemaData: Schema
  history: [string, string][]
  organizationId: string
  buildingSchemaId: string
  latestVersionNumber: number
  designSessionId: string
  userId: string
  recursionLimit?: number
}

/**
 * Result type for agent workflow execution
 */
export type AgentWorkflowResult = Result<WorkflowState, Error>
