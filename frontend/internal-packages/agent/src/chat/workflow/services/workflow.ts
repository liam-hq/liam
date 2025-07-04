import { END, START, StateGraph } from '@langchain/langgraph'
import { WORKFLOW_ERROR_MESSAGES } from '../constants'
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
} from '../nodes'
import {
  createAnnotations,
  DEFAULT_RECURSION_LIMIT,
} from '../shared/langGraphUtils'
import type { WorkflowState } from '../types'

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
 * Execute workflow using LangGraph
 */
export const executeWorkflow = async (
  initialState: WorkflowState,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT,
): Promise<WorkflowState> => {
  try {
    const compiled = createGraph()

    const result = await compiled.invoke(initialState, {
      recursionLimit,
    })

    return result
  } catch (error) {
    console.error(WORKFLOW_ERROR_MESSAGES.LANGGRAPH_FAILED, error)

    // Even with LangGraph execution failure, go through finalizeArtifactsNode to ensure proper response
    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    const errorState = { ...initialState, error: errorMessage }
    return await finalizeArtifactsNode(errorState)
  }
}
