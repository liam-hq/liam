import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { WORKFLOW_ERROR_MESSAGES } from './chat/workflow/constants.ts'
import {
  analyzeRequirementsNode,
  designSchemaNode,
  executeDdlNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  reviewDeliverablesNode,
  saveUserMessageNode,
  validateSchemaNode,
  webSearchNode,
} from './chat/workflow/nodes/index.ts'
import {
  createAnnotations,
  DEFAULT_RECURSION_LIMIT,
} from './chat/workflow/shared/langGraphUtils.ts'
import type { WorkflowConfigurable, WorkflowState } from './chat/workflow/types.ts'

export type DeepModelingParams = {
  userInput: string
  schemaData: Schema
  history: [string, string][]
  organizationId?: string
  buildingSchemaId: string
  latestVersionNumber: number
  designSessionId: string
  userId: string
  recursionLimit?: number
}

export type DeepModelingResult = Result<WorkflowState, Error>

/**
 * Retry policy configuration for all nodes
 */
const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
}

/**
 * Create and configure the LangGraph workflow
 */
const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('saveUserMessage', saveUserMessageNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('webSearch', webSearchNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('executeDDL', executeDdlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('reviewDeliverables', reviewDeliverablesNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('finalizeArtifacts', finalizeArtifactsNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'saveUserMessage')
    .addEdge('webSearch', 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edge for saveUserMessage - skip to finalizeArtifacts if error, otherwise go to webSearch
    .addConditionalEdges('saveUserMessage', (state) => {
      return state.error ? 'finalizeArtifacts' : 'webSearch'
    })

    // Conditional edge for designSchema - skip to finalizeArtifacts if error
    .addConditionalEdges('designSchema', (state) => {
      return state.error ? 'finalizeArtifacts' : 'executeDDL'
    })

    // Conditional edge for executeDDL - retry with designSchema if DDL execution fails
    .addConditionalEdges('executeDDL', (state) => {
      if (state.shouldRetryWithDesignSchema) {
        return 'designSchema'
      }
      if (state.ddlExecutionFailed) {
        return 'finalizeArtifacts'
      }
      return 'generateUsecase'
    })

    // Conditional edges for validation results
    .addConditionalEdges('validateSchema', (state) => {
      // success → reviewDeliverables
      // dml error or test fail → designSchema
      return state.error ? 'designSchema' : 'reviewDeliverables'
    })

    // Conditional edges for review results
    .addConditionalEdges('reviewDeliverables', (state) => {
      // OK → finalizeArtifacts
      // NG or issues found → analyzeRequirements
      return state.error ? 'analyzeRequirements' : 'finalizeArtifacts'
    })

  return graph.compile()
}

/**
 * Execute Deep Modeling workflow
 */
export const deepModeling = async (
  params: DeepModelingParams,
  config: {
    configurable: WorkflowConfigurable
  },
): Promise<DeepModelingResult> => {
  const {
    userInput,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    designSessionId,
    userId,
    recursionLimit = DEFAULT_RECURSION_LIMIT,
  } = params

  const { repositories, logger } = config.configurable

  // Convert history to BaseMessage objects
  const messages = history.map(([role, content]) => {
    return role === 'assistant'
      ? new AIMessage(content)
      : new HumanMessage(content)
  })

  // Add the current user input as the latest message
  messages.push(new HumanMessage(userInput))

  // Create workflow state
  const workflowState: WorkflowState = {
    userInput: userInput,
    messages,
    schemaData,
    organizationId,
    buildingSchemaId,
    latestVersionNumber,
    designSessionId,
    userId,
    retryCount: {},
  }

  const workflowRunId = uuidv4()

  try {
    const createWorkflowRunResult = await repositories.schema.createWorkflowRun(
      {
        designSessionId,
        workflowRunId,
      },
    )

    if (!createWorkflowRunResult.success) {
      return err(
        new Error(
          `Failed to create workflow run record: ${createWorkflowRunResult.error}`,
        ),
      )
    }

    const compiled = createGraph()
    const runCollector = new RunCollectorCallbackHandler()
    const result = await compiled.invoke(workflowState, {
      recursionLimit,
      configurable: {
        repositories,
        logger,
      },
      runId: workflowRunId,
      callbacks: [runCollector],
    })

    if (result.error) {
      await repositories.schema.updateWorkflowRunStatus({
        workflowRunId,
        status: 'error',
      })
      return err(new Error(result.error.message))
    }

    await repositories.schema.updateWorkflowRunStatus({
      workflowRunId,
      status: 'success',
    })

    return ok(result)
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    await repositories.schema.updateWorkflowRunStatus({
      workflowRunId,
      status: 'error',
    })

    const errorState = { ...workflowState, error: new Error(errorMessage) }
    const finalizedResult = await finalizeArtifactsNode(errorState, {
      configurable: {
        repositories,
        logger,
      },
    })

    return err(new Error(finalizedResult.error?.message || errorMessage))
  }
}

export type DeepModelingOfflineParams = {
  userInput: string
  schemaData?: Schema
  history?: [string, string][]
  organizationId?: string
  buildingSchemaId?: string
  latestVersionNumber?: number
  designSessionId?: string
  userId?: string
  recursionLimit?: number
}

/**
 * Execute Deep Modeling workflow in offline mode without database dependencies
 */
export const deepModelingOffline = async (
  params: DeepModelingOfflineParams,
): Promise<DeepModelingResult> => {
  const {
    userInput,
    schemaData = { tables: {}, relations: [] },
    history = [],
    organizationId = 'offline-org',
    buildingSchemaId = 'offline-schema',
    latestVersionNumber = 0,
    designSessionId = `offline-session-${Date.now()}`,
    userId = 'offline-user',
    recursionLimit = DEFAULT_RECURSION_LIMIT,
  } = params

  // Create in-memory repositories
  const { createInMemoryRepositories } = await import('./repositories/index.ts')
  const repositories = createInMemoryRepositories()

  // Create a simple logger for offline mode
  const logger = {
    log: (message: string) => console.log(`[DeepModeling] ${message}`),
    error: (message: string) => console.error(`[DeepModeling] ${message}`),
    warn: (message: string) => console.warn(`[DeepModeling] ${message}`),
  }

  // Call the main deepModeling function with offline configuration
  return deepModeling(
    {
      userInput,
      schemaData,
      history,
      organizationId,
      buildingSchemaId,
      latestVersionNumber,
      designSessionId,
      userId,
      recursionLimit,
    },
    {
      configurable: {
        repositories,
        logger,
      },
    },
  )
}
