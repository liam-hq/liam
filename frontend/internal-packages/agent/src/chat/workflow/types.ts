import type { Schema } from '@liam-hq/db-structure'
import type { Usecase } from '../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../repositories'
import type { NodeLogger } from '../../utils/nodeLogger'

export type WorkflowState = {
  userInput: string
  analyzedRequirements?:
    | {
        businessRequirement: string
        functionalRequirements: Record<string, string[]>
        nonFunctionalRequirements: Record<string, string[]>
      }
    | undefined
  generatedUsecases?: Usecase[] | undefined
  generatedAnswer?: string | undefined
  finalResponse?: string | undefined
  formattedHistory: string
  schemaData: Schema
  projectId?: string | undefined
  error?: string | undefined
  retryCount: Record<string, number>

  ddlStatements?: string | undefined

  // Schema update fields
  buildingSchemaId: string
  latestVersionNumber: number
  organizationId?: string | undefined
  userId: string

  // Message saving fields
  designSessionId: string

  // Repository dependencies for data access
  repositories: Repositories

  // Logging functionality
  logger: NodeLogger

  // Progress callback for node execution
  onNodeProgress?:
    | ((nodeName: string, progress: number) => Promise<void>)
    | undefined
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
  recursionLimit?: number
}
