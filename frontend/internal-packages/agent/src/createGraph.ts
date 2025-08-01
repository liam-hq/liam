import { END, START, StateGraph } from '@langchain/langgraph'
import {
  analyzeRequirementsNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  validateSchemaNode,
  webSearchNode,
} from './chat/workflow/nodes'
import { createAnnotations } from './chat/workflow/shared/langGraphUtils'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'

/**
 * Retry policy configuration for all nodes
 */
const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
}

/**
 * Create and configure the LangGraph workflow
 */
export const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  // Create DB Agent subgraph
  const dbAgentSubgraph = createDbAgentGraph()

  graph
    .addNode('webSearch', webSearchNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('dbAgent', dbAgentSubgraph)
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('finalizeArtifacts', finalizeArtifactsNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'webSearch')
    .addEdge('webSearch', 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'generateUsecase')
    .addEdge('finalizeArtifacts', END)
    .addEdge('generateUsecase', 'dbAgent')
    .addEdge('dbAgent', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')

    // Conditional edges for validation results
    .addConditionalEdges(
      'validateSchema',
      (state) => {
        // success → finalizeArtifacts
        // dml error or test fail → generateUsecase (restart from use case generation)
        return state.error ? 'generateUsecase' : 'finalizeArtifacts'
      },
      {
        generateUsecase: 'generateUsecase',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

  return graph.compile()
}
