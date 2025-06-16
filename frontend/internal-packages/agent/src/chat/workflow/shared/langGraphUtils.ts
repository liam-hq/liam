import { Annotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Repositories } from '../../../repositories'

export const DEFAULT_RECURSION_LIMIT = 10

/**
 * Create LangGraph-compatible annotations (shared)
 */
export const createAnnotations = () => {
  return Annotation.Root({
    userInput: Annotation<string>,
    generatedAnswer: Annotation<string | undefined>,
    finalResponse: Annotation<string | undefined>,
    history: Annotation<string[]>,
    schemaData: Annotation<Schema>,
    projectId: Annotation<string | undefined>,
    buildingSchemaId: Annotation<string>,
    latestVersionNumber: Annotation<number | undefined>,
    organizationId: Annotation<string | undefined>,
    userId: Annotation<string>,
    designSessionId: Annotation<string>,
    error: Annotation<string | undefined>,

    brd: Annotation<string[] | undefined>,
    useCases: Annotation<string[] | undefined>,
    validationQueries: Annotation<string[] | undefined>,
    validationResults: Annotation<
      | Array<{
          query: string
          success: boolean
          resultSet?: string
          errorMessage?: string
        }>
      | undefined
    >,

    retryCount: Annotation<number | undefined>,

    repositories: Annotation<Repositories>,
  })
}
