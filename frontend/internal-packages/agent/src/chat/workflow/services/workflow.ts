import { END, START, StateGraph } from '@langchain/langgraph'
import { WORKFLOW_ERROR_MESSAGES } from '../constants/progressMessages'
import {
  analyzeRequirementsNode,
  designSchemaNode,
  finalizeArtifactsNode,
  reviewDeliverablesNode,
  validateSchemaNode,
} from '../nodes'
import {
  DEFAULT_RECURSION_LIMIT,
  createAnnotations,
} from '../shared/langGraphUtils'
import type { WorkflowState } from '../types'

/**
 * Create and configure the LangGraph workflow
 */
const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('analyzeRequirements', analyzeRequirementsNode)
    .addNode('designSchema', designSchemaNode)
    .addNode('validateSchema', validateSchemaNode)
    .addNode('reviewDeliverables', reviewDeliverablesNode)
    .addNode('finalizeArtifacts', finalizeArtifactsNode)

    .addEdge(START, 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('designSchema', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

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

    return result as WorkflowState
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
