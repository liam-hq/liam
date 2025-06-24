import { Annotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'
import type { NodeLogger } from '../../../utils/nodeLogger'

export const DEFAULT_RECURSION_LIMIT = 10

/**
 * Create LangGraph-compatible annotations (shared)
 */
export const createAnnotations = () => {
  return Annotation.Root({
    userInput: Annotation<string>,
    analyzedRequirements: Annotation<
      | {
          businessRequirement: string
          functionalRequirements: Record<string, string[]>
          nonFunctionalRequirements: Record<string, string[]>
        }
      | undefined
    >,
    generatedUsecases: Annotation<Usecase[] | undefined>,
    generatedAnswer: Annotation<string | undefined>,
    finalResponse: Annotation<string | undefined>,
    formattedHistory: Annotation<string>,
    schemaData: Annotation<Schema>,
    projectId: Annotation<string | undefined>,
    buildingSchemaId: Annotation<string>,
    latestVersionNumber: Annotation<number>,
    organizationId: Annotation<string | undefined>,
    userId: Annotation<string>,
    designSessionId: Annotation<string>,
    error: Annotation<string | undefined>,
    retryCount: Annotation<Record<string, number>>,

    // Repository dependencies for data access
    repositories: Annotation<Repositories>,

    // Logging functionality
    logger: Annotation<NodeLogger>,
  })
}
