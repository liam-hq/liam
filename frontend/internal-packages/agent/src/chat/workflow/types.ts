import type { BaseMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import type { Testcase } from '../../qa-agent/types'
import type { Repositories } from '../../repositories'
import type { AnalyzedRequirementsAnnotationType } from '../../utils/schema/analyzedRequirements'

export type WorkflowState = {
  messages: BaseMessage[]
  userInput: string
  analyzedRequirements?: AnalyzedRequirementsAnnotationType
  testcases: Testcase[]
  schemaData: Schema

  // DML execution results
  dmlExecutionErrors?: string | undefined

  // Schema update fields
  buildingSchemaId: string
  latestVersionNumber: number
  organizationId: string
  userId: string

  // Message saving fields
  designSessionId: string

  next: string
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
