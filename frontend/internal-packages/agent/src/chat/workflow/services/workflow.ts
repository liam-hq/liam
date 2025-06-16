import { END, START, StateGraph } from '@langchain/langgraph'
import { WORKFLOW_ERROR_MESSAGES } from '../constants/progressMessages'
import {
  analyzeRequirementsNode,
  answerGenerationNode,
  finalResponseNode,
  reviewDeliverablesNode,
  validateSchemaNode,
} from '../nodes'
import {
  DEFAULT_RECURSION_LIMIT,
  createAnnotations,
} from '../shared/langGraphUtils'
import type { WorkflowState } from '../types'

function shouldReturnToDesignSchema(state: any): string {
  if ((state as WorkflowState).error) {
    return 'designSchema'
  }
  return 'reviewDeliverables'
}

function shouldReturnToDesignSchemaFromReview(state: any): string {
  if ((state as WorkflowState).error) {
    return 'designSchema'
  }
  return 'formatFinalResponse'
}

/**
 * Create and configure the LangGraph workflow
 */
const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('analyzeRequirements', analyzeRequirementsNode)
    .addNode('designSchema', answerGenerationNode)
    .addNode('validateSchema', validateSchemaNode)
    .addNode('reviewDeliverables', reviewDeliverablesNode)
    .addNode('formatFinalResponse', finalResponseNode)
    .addEdge(START, 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('designSchema', 'validateSchema')
    .addConditionalEdges('validateSchema', shouldReturnToDesignSchema, {
      designSchema: 'designSchema',
      reviewDeliverables: 'reviewDeliverables',
    })
    .addConditionalEdges(
      'reviewDeliverables',
      shouldReturnToDesignSchemaFromReview,
      {
        designSchema: 'designSchema',
        formatFinalResponse: 'formatFinalResponse',
      },
    )
    .addEdge('formatFinalResponse', END)

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

    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED

    const errorState = { ...initialState, error: errorMessage }
    return await finalResponseNode(errorState)
  }
}
