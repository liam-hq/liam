import { Annotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
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
export const DEFAULT_RECURSION_LIMIT = 20

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

    ddlStatements: Annotation<string | undefined>,

    // Repository dependencies for data access
    repositories: Annotation<Repositories>,

    // Logging functionality
    logger: Annotation<NodeLogger>,
  })
}
