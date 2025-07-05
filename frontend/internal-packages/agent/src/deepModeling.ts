import { END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import { WORKFLOW_ERROR_MESSAGES } from './chat/workflow/constants'
import {
  analyzeRequirementsNode,
  createProgressMessageNode,
  designSchemaNode,
  executeDDLNode,
  finalizeArtifactsNode,
  generateDDLNode,
  generateUsecaseNode,
  prepareDMLNode,
  reviewDeliverablesNode,
  saveUserMessageNode,
  validateSchemaNode,
} from './chat/workflow/nodes'
import {
  createAnnotations,
  DEFAULT_RECURSION_LIMIT,
} from './chat/workflow/shared/langGraphUtils'
import type { WorkflowState } from './chat/workflow/types'
import type { Repositories } from './repositories'
import type { NodeLogger } from './utils/nodeLogger'

export interface DeepModelingParams {
  userInput: string
  schemaData: Schema
  history: [string, string][]
  organizationId?: string
  buildingSchemaId: string
  latestVersionNumber: number
  repositories: Repositories
  designSessionId: string
  userId: string
  logger: NodeLogger
  recursionLimit?: number
}

export type DeepModelingResult =
  | {
      text: string
      success: true
    }
  | {
      success: false
      error: string | undefined
    }

/**
 * Format chat history array into a string
 * @param history - Array of formatted chat history strings
 * @returns Formatted chat history string or default message if empty
 */
const formatChatHistory = (history: string[]): string => {
  return history.length > 0 ? history.join('\n') : 'No previous conversation.'
}

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
    .addNode('createProgressMessage', createProgressMessageNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateDDL', generateDDLNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('executeDDL', executeDDLNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDMLNode, {
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
    .addEdge('createProgressMessage', 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('generateDDL', 'executeDDL')
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edge for saveUserMessage - skip to finalizeArtifacts if error
    .addConditionalEdges('saveUserMessage', (state) => {
      return state.error ? 'finalizeArtifacts' : 'createProgressMessage'
    })

    // Conditional edge for designSchema - skip to finalizeArtifacts if error
    .addConditionalEdges('designSchema', (state) => {
      return state.error ? 'finalizeArtifacts' : 'generateDDL'
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
): Promise<DeepModelingResult> => {
  const {
    userInput,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    repositories,
    designSessionId,
    userId,
    logger,
    recursionLimit = DEFAULT_RECURSION_LIMIT,
  } = params

  // Convert history format with role prefix
  const historyArray = history.map(([role, content]) => {
    const prefix = role === 'assistant' ? 'Assistant' : 'User'
    return `${prefix}: ${content}`
  })

  // Create workflow state
  const workflowState: WorkflowState = {
    userInput: userInput,
    formattedHistory: formatChatHistory(historyArray),
    schemaData,
    organizationId,
    buildingSchemaId,
    latestVersionNumber,
    repositories,
    designSessionId,
    userId,
    logger,
    retryCount: {},
  }

  try {
    const compiled = createGraph()

    const result = await compiled.invoke(workflowState, {
      recursionLimit,
    })

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      text: result.finalResponse || result.generatedAnswer || '',
      success: true,
    }
  } catch (error) {
    logger.error(WORKFLOW_ERROR_MESSAGES.LANGGRAPH_FAILED, { error })

    // Even with LangGraph execution failure, go through finalizeArtifactsNode to ensure proper response
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    const errorState = { ...workflowState, error: errorMessage }
    const finalizedResult = await finalizeArtifactsNode(errorState)

    return {
      success: false,
      error: finalizedResult.error,
    }
  }
}
