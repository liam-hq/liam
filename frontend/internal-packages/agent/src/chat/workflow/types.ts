import type { Schema } from '@liam-hq/db-structure'
import type { Repositories } from '../../repositories'
import type { NodeLogger } from '../../utils/nodeLogger'

export type WorkflowState = {
  userInput: string
  generatedAnswer?: string | undefined
  finalResponse?: string | undefined
  formattedHistory: string
  schemaData: Schema
  projectId?: string | undefined
  error?: string | undefined

  ddlStatements?: string | undefined

  // Schema update fields
  buildingSchemaId: string
  latestVersionNumber?: number | undefined
  organizationId?: string | undefined
  userId: string

  // Message saving fields
  designSessionId: string

  // Repository dependencies for data access
  repositories: Repositories

  // Logging functionality
  logger: NodeLogger
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
  recursionLimit?: number
}
