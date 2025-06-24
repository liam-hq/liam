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
 * Determines the next node or END based on retry logic and error state
 */
const getNextNodeOrEnd = (
  state: WorkflowState,
  nodeName: string,
  nextNode: string,
  maxRetries = 3,
): string => {
  const retryCount = state.retryCount[nodeName] ?? 0

  // If there's an error and retry count hasn't exceeded max, retry the same node
  if (state.error && retryCount < maxRetries) {
    return nodeName
  }

  // If retry is exhausted but there's still an error, go to END
  if (state.error) {
    return END
  }

  // Normal flow: proceed to next node
  return nextNode
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

    // Conditional edges with retry logic - each node will retry up to maxRetries times on error
    // If maxRetries is exceeded and error persists, workflow goes to END
    .addConditionalEdges('analyzeRequirements', (state) => {
      return getNextNodeOrEnd(state, 'analyzeRequirements', 'designSchema')
    })
    .addConditionalEdges('designSchema', (state) => {
      return getNextNodeOrEnd(state, 'designSchema', 'generateDDL')
    })
    .addConditionalEdges('generateDDL', (state) => {
      return getNextNodeOrEnd(state, 'generateDDL', 'executeDDL')
    })
    .addConditionalEdges('executeDDL', (state) => {
      return getNextNodeOrEnd(state, 'executeDDL', 'generateUsecase')
    })
    .addConditionalEdges('generateUsecase', (state) => {
      return getNextNodeOrEnd(state, 'generateUsecase', 'prepareDML')
    })
    .addConditionalEdges('prepareDML', (state) => {
      return getNextNodeOrEnd(state, 'prepareDML', 'validateSchema')
    })
    .addConditionalEdges('validateSchema', (state) => {
      return getNextNodeOrEnd(state, 'validateSchema', 'reviewDeliverables')
    })
    .addConditionalEdges('reviewDeliverables', (state) => {
      return getNextNodeOrEnd(state, 'reviewDeliverables', 'finalizeArtifacts')
    })
    .addConditionalEdges('finalizeArtifacts', (state) => {
      return getNextNodeOrEnd(state, 'finalizeArtifacts', END)
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
