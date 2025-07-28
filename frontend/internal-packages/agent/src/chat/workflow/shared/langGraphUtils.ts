import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'

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
 * Setting this to 20 ensures:
 * - Complete workflow execution under normal conditions
 * - Sufficient headroom for error handling loops
 * - Protection against infinite loops
 */
export const DEFAULT_RECURSION_LIMIT = 20

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
    projectId: Annotation<string | undefined>,
    buildingSchemaId: Annotation<string>,
    latestVersionNumber: Annotation<number>,
    buildingSchemaVersionId: Annotation<string | undefined>,
    organizationId: Annotation<string>,
    userId: Annotation<string>,
    designSessionId: Annotation<string>,
    error: Annotation<Error | undefined>,
    retryCount: Annotation<Record<string, number>>,

    ddlStatements: Annotation<string | undefined>,
    dmlStatements: Annotation<string | undefined>,

    // DDL execution retry mechanism
    shouldRetryWithDesignSchema: Annotation<boolean | undefined>,
    ddlExecutionFailed: Annotation<boolean | undefined>,
    ddlExecutionFailureReason: Annotation<string | undefined>,

    // Repository dependencies for data access
    repositories: Annotation<Repositories>,
  })
}
