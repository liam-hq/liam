import type { Schema } from '@liam-hq/schema'
import type { ResultAsync } from 'neverthrow'
import type { WorkflowState } from './chat/workflow/types'

/**
 * Parameters for agent workflow execution
 */
export type AgentWorkflowParams = {
  userInput: string
  schemaData: Schema
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
export type AgentWorkflowResult = ResultAsync<WorkflowState, Error>
