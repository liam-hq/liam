import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { WORKFLOW_ERROR_MESSAGES } from './chat/workflow/constants'
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
} from './chat/workflow/nodes'
import {
  createAnnotations,
  DEFAULT_RECURSION_LIMIT,
} from './chat/workflow/shared/langGraphUtils'
import type { WorkflowConfigurable, WorkflowState } from './chat/workflow/types'

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
  artifactMode?: 'simple' | 'full'
}

export type DeepModelingResult = Result<
  {
    text: string
  },
  Error
>

/**
 * Retry policy configuration for all nodes
 */
const RETRY_POLICY = {
  maxAttempts: 3,
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
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edge for saveUserMessage - skip to finalizeArtifacts if error
    .addConditionalEdges('saveUserMessage', (state) => {
      return state.error ? 'finalizeArtifacts' : 'analyzeRequirements'
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
    artifactMode = 'full',
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
    artifactMode,
  }

  try {
    const compiled = createGraph()
    const result = await compiled.invoke(workflowState, {
      recursionLimit,
      configurable: {
        repositories,
        logger,
      },
    })

    if (result.error) {
      return err(new Error(result.error.message))
    }

    return ok({
      text: result.finalResponse || result.generatedAnswer || '',
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

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
