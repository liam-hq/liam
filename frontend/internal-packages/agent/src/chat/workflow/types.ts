import type { BaseMessage } from '@langchain/core/messages'
import type { DmlOperation } from '@liam-hq/artifact'
import type { Schema } from '@liam-hq/db-structure'
import type { Usecase } from '../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../repositories'

export type WorkflowState = {
  messages: BaseMessage[]
  userInput: string
  webSearchResults?: string | undefined
  analyzedRequirements?:
    | {
        businessRequirement: string
        functionalRequirements: Record<string, string[]>
        nonFunctionalRequirements: Record<string, string[]>
      }
    | undefined
  generatedUsecases?: Usecase[] | undefined
  schemaData: Schema
  retryCount: Record<string, number>

  ddlStatements?: string | undefined
  dmlStatements?: string | undefined
  dmlOperations?: DmlOperation[] | undefined

  // DML execution results
  dmlExecutionSuccessful?: boolean | undefined
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
}
