import type { AgentName } from '../../langchain/utils/types'
import type { Schema } from '@liam-hq/db-structure'

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

  schemaText?: string
  formattedChatHistory?: string
  agentName?: AgentName

  buildingSchemaId: string
  latestVersionNumber?: number
  organizationId?: string
  userId?: string
}

export type ResponseChunk = {
  type: 'text' | 'error' | 'custom'
  content: string
}

export interface WorkflowOptions {
  streaming?: boolean
  recursionLimit?: number
}

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

export const isWorkflowStepFailure = (
  result: WorkflowStepResult,
): result is WorkflowStepFailure => {
  return 'error' in result && typeof result.error === 'string'
}

export const isWorkflowState = (val: unknown): val is WorkflowState => {
  return (
    val !== null &&
    typeof val === 'object' &&
    'userInput' in val &&
    'history' in val
  )
}
