import { Annotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'
import type { NodeLogger } from '../../../utils/nodeLogger'

/**
 * Default recursion limit for LangGraph workflow execution.
 * This value limits the total number of state transitions (edges) in the graph.
 *
 * The workflow has 9 nodes with a maximum of 3 retries per node:
 * - Normal execution: 10 transitions (START → 9 nodes → END)
 * - With retries: up to 37 transitions (10 normal + 27 retry transitions)
 *
 * Setting this to 40 ensures:
 * - Complete workflow execution under normal conditions
 * - Sufficient headroom for error handling and retries
 * - Protection against infinite loops
 */
export const DEFAULT_RECURSION_LIMIT = 40

/**
 * Create LangGraph-compatible annotations (shared)
 */
export const createAnnotations = () => {
  return Annotation.Root({
    userInput: Annotation<string>({
      reducer: (_, newValue: string) => newValue,
      default: () => '',
    }),
    analyzedRequirements: Annotation<
      | {
          businessRequirement: string
          functionalRequirements: Record<string, string[]>
          nonFunctionalRequirements: Record<string, string[]>
        }
      | undefined
    >({ reducer: (_, newValue) => newValue }),
    generatedUsecases: Annotation<Usecase[] | undefined>({
      reducer: (_, newValue) => newValue,
    }),
    generatedAnswer: Annotation<string | undefined>({
      reducer: (_, newValue) => newValue,
    }),
    finalResponse: Annotation<string | undefined>({
      reducer: (_, newValue) => newValue,
    }),
    formattedHistory: Annotation<string>({
      reducer: (_, newValue) => newValue,
      default: () => '',
    }),
    schemaData: Annotation<Schema>({ reducer: (_, newValue) => newValue }),
    projectId: Annotation<string | undefined>({
      reducer: (_, newValue) => newValue,
    }),
    buildingSchemaId: Annotation<string>({
      reducer: (_, newValue) => newValue,
      default: () => '',
    }),
    latestVersionNumber: Annotation<number>({
      reducer: (_, newValue) => newValue,
    }),
    organizationId: Annotation<string | undefined>({
      reducer: (_, newValue) => newValue,
    }),
    userId: Annotation<string>({
      reducer: (_, newValue) => newValue,
      default: () => '',
    }),
    designSessionId: Annotation<string>({
      reducer: (_, newValue) => newValue,
      default: () => '',
    }),
    error: Annotation<string | undefined>({
      reducer: (_, newValue) => newValue,
    }),
    retryCount: Annotation<Record<string, number>>({
      reducer: (existing, newValue) => ({ ...existing, ...newValue }),
      default: () => ({}),
    }),

    // Repository dependencies for data access
    repositories: Annotation<Repositories>({
      reducer: (_, newValue) => newValue,
    }),

    // Logging functionality
    logger: Annotation<NodeLogger>({ reducer: (_, newValue) => newValue }),
  })
}
