import { END, START, StateGraph } from '@langchain/langgraph'
import { WORKFLOW_ERROR_MESSAGES } from '../constants/progressMessages'
import {
  analyzeRequirementsNode,
  designSchemaNode,
  executeDDLNode,
  finalizeArtifactsNode,
  generateDDLNode,
  generateUsecaseNode,
  prepareDMLNode,
  reviewDeliverablesNode,
  validateSchemaNode,
} from '../nodes'
import {
  createAnnotations,
  DEFAULT_RECURSION_LIMIT,
} from '../shared/langGraphUtils'
import type { WorkflowState } from '../types'

/**
 * Determines if a node should retry based on error state and retry count
 */
const shouldRetry = (
  state: WorkflowState,
  nodeName: string,
  maxRetries = 3,
): 'retry' | 'continue' => {
  const retryCount = state.retryCount[nodeName] ?? 0

  if (state.error && retryCount < maxRetries) {
    return 'retry'
  }

  return 'continue'
}

/**
 * Create and configure the LangGraph workflow
 */
const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('analyzeRequirements', analyzeRequirementsNode)
    .addNode('designSchema', designSchemaNode)
    .addNode('generateDDL', generateDDLNode)
    .addNode('executeDDL', executeDDLNode)
    .addNode('generateUsecase', generateUsecaseNode)
    .addNode('prepareDML', prepareDMLNode)
    .addNode('validateSchema', validateSchemaNode)
    .addNode('reviewDeliverables', reviewDeliverablesNode)
    .addNode('finalizeArtifacts', finalizeArtifactsNode)

    .addEdge(START, 'analyzeRequirements')
    .addEdge('designSchema', 'generateDDL')
    .addEdge('generateDDL', 'executeDDL')
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    .addConditionalEdges('analyzeRequirements', (state) => {
      const retryResult = shouldRetry(state, 'analyzeRequirements')
      return retryResult === 'retry' ? 'analyzeRequirements' : 'designSchema'
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
