import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'
import type { NodeLogger } from '../../../utils/nodeLogger'

/**
 * Default recursion limit for LangGraph workflow execution.
 * This value limits the total number of state transitions (edges) in the graph.
 *
 * Important: Node retries do NOT count toward this limit. The limit only
 * applies to transitions between nodes.
 *
 * The workflow has 9 nodes:
 * - Normal execution: 10 transitions (START → 9 nodes → END)
 * - With error loops: May have additional transitions when errors occur
 *   (e.g., validateSchema → designSchema, reviewDeliverables → analyzeRequirements)
 *
 * Setting this to 20 ensures:
 * - Complete workflow execution under normal conditions
 * - Sufficient headroom for error handling loops
 * - Protection against infinite loops
 */
export const DEFAULT_RECURSION_LIMIT = 50

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
    dmlOperations: Annotation<
      | Array<{
          usecase: Usecase
          operations: DMLOperation[]
        }>
      | undefined
    >,

    // DML execution results by operation
    dmlExecutionResults: Annotation<
      | Array<{
          usecase: Usecase
          operationResults: Array<{
            operation: DMLOperation
            result: SqlResult
          }>
        }>
      | undefined
    >,

    // DDL execution retry mechanism
    shouldRetryWithDesignSchema: Annotation<boolean | undefined>,
    ddlExecutionFailed: Annotation<boolean | undefined>,
    ddlExecutionFailureReason: Annotation<string | undefined>,

    // DML execution results
    dmlExecutionSuccessful: Annotation<boolean | undefined>,
    dmlExecutionErrors: Annotation<string | undefined>,
    dmlValidationFailureReason: Annotation<string | undefined>,

    // Repository dependencies for data access
    repositories: Annotation<Repositories>,

    // Logging functionality
    logger: Annotation<NodeLogger>,

    // Error context for retries
    previousErrors: Annotation<Record<string, string[]> | undefined>,
  })
}
