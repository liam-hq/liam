import type { Schema } from '@liam-hq/db-structure'
import type { AgentName } from '../../langchain/utils/types'

export type { AgentName }

export type WorkflowMode = 'Ask' | 'Build'

export type WorkflowState = {
  mode?: WorkflowMode | undefined
  userInput: string
  generatedAnswer?: string | undefined
  finalResponse?: string | undefined
  history: string[]
  schemaData?: Schema | undefined
  projectId?: string | undefined
  error?: string | undefined

  schemaText?: string | undefined
  formattedChatHistory?: string | undefined
  agentName?: AgentName | undefined

  buildingSchemaId: string
  latestVersionNumber?: number | undefined
  organizationId?: string | undefined
  userId?: string | undefined
}

export type ResponseChunk = {
  type: 'text' | 'error' | 'custom'
  content: string
}

export interface WorkflowOptions {
  streaming?: boolean
  recursionLimit?: number
}
