import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'

/**
 * Default recursion limit for LangGraph workflow execution.
 * This value limits the total number of state transitions (edges) in the graph.
 *
 * Important: Node retries do NOT count toward this limit. The limit only
 * applies to transitions between nodes.
 *
 * The workflow has 8 nodes:
 * - Normal execution: 9 transitions (START → 8 nodes → END)
 * - With error loops: May have additional transitions when errors occur
 *   (e.g., validateSchema → designSchema)
 *
 * Setting this to 100 ensures:
 * - Complete workflow execution under normal conditions
 * - Ample headroom for complex error handling loops and retries
 * - Protection against infinite loops while allowing for complex workflows
 * - Sufficient capacity for finding optimal workflow patterns
 */
export const DEFAULT_RECURSION_LIMIT = 100

/**
 * Create LangGraph-compatible annotations (shared)
 */
export const createAnnotations = () => {
  return Annotation.Root({
    ...MessagesAnnotation.spec,
    userInput: Annotation<string>,
    webSearchResults: Annotation<string | undefined>,
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
    projectId: Annotation<string | undefined>,
    error: Annotation<Error | undefined>,
    retryCount: Annotation<Record<string, number>>,

    ddlStatements: Annotation<string | undefined>,
    dmlStatements: Annotation<string | undefined>,

    dmlExecutionSuccessful: Annotation<boolean | undefined>,
    dmlExecutionErrors: Annotation<string | undefined>,

    buildingSchemaId: Annotation<string>,
    latestVersionNumber: Annotation<number>,
    organizationId: Annotation<string>,
    userId: Annotation<string>,

    designSessionId: Annotation<string>,
  })
}
