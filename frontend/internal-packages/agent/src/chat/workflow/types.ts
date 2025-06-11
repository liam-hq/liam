import type { Schema } from '@liam-hq/db-structure'
import type { AgentName } from '../../langchain'

// Re-export AgentName for use within workflow modules
export type { AgentName }

export type WorkflowState = {
  userInput: string
  generatedAnswer?: string | undefined
  finalResponse?: string | undefined
  history: string[]
  schemaData?: Schema | undefined
  projectId?: string | undefined
  error?: string | undefined

  // Additional fields for workflow processing
  schemaText?: string | undefined
  formattedChatHistory?: string | undefined
  agentName?: AgentName | undefined

  // Schema update fields
  buildingSchemaId?: string | undefined
  latestVersionNumber?: number | undefined
  organizationId?: string | undefined
  userId?: string | undefined

  // Trigger.dev job tracking
  triggerJobId?: string | undefined
}

/**
 * Response chunk type for streaming
 */
export type ResponseChunk = {
  type: 'text' | 'error' | 'custom' | 'trigger_job_id'
  content: string
}

/**
 * Background job status interface
 */
export interface BackgroundJobStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generatedAnswer?: string
  error?: string
  createdAt: string
  completedAt?: string
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
  streaming?: boolean
  recursionLimit?: number
}
