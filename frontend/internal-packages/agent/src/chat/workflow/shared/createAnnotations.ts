import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'

/**
 * Create LangGraph-compatible annotations (shared)
 */
export const createAnnotations = () => {
  return Annotation.Root({
    ...MessagesAnnotation.spec,
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
    schemaData: Annotation<Schema>,
    buildingSchemaId: Annotation<string>,
    latestVersionNumber: Annotation<number>,
    organizationId: Annotation<string>,
    userId: Annotation<string>,
    designSessionId: Annotation<string>,

    ddlStatements: Annotation<string | undefined>,
    dmlStatements: Annotation<string | undefined>,

    // DML execution results
    dmlExecutionErrors: Annotation<string | undefined>,
  })
}
