import type { BaseMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import type { Usecase } from '../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../repositories'

export type WorkflowState = {
  messages: BaseMessage[]
  userInput: string
  analyzedRequirements?:
    | {
        businessRequirement: string
        functionalRequirements: Record<string, string[]>
        nonFunctionalRequirements: Record<string, string[]>
      }
    | undefined
  generatedUsecases?: Usecase[] | undefined
  schemaData: Schema

  dmlStatements?: string | undefined

  // DML execution results
  dmlExecutionErrors?: string | undefined

  // Schema update fields
  buildingSchemaId: string
  latestVersionNumber: number
  organizationId: string
  userId: string

  // Message saving fields
  designSessionId: string
}

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
