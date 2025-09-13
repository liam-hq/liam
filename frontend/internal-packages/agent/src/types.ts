import type { Schema } from '@liam-hq/schema'
import type { ResultAsync } from 'neverthrow'
import type * as v from 'valibot'
import type { Repositories } from './repositories'
import type { reasoningSchema } from './utils/validationSchema'
import type { workflowAnnotation } from './workflowAnnotation'

export type WorkflowState = typeof workflowAnnotation.State

/**
 * Type definition for the configurable object passed to workflow nodes
 */
export type WorkflowConfigurable = {
  repositories: Repositories
  /**
   * Thread ID for checkpoint functionality (maps to designSessionId)
   */
  thread_id: string
}

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

export type Reasoning = v.InferOutput<typeof reasoningSchema>
