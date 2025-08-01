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
import { RETRY_POLICY } from './shared/errorHandling'

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
    .addNode('dbAgent', dbAgentSubgraph)
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
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
    .addEdge('analyzeRequirements', 'dbAgent')
    .addEdge('dbAgent', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edges for validation results
    .addConditionalEdges(
      'validateSchema',
      (state) => {
        // success → finalizeArtifacts
        // dml error or test fail → dbAgent
        return state.dmlExecutionSuccessful === false
          ? 'dbAgent'
          : 'finalizeArtifacts'
      },
      {
        dbAgent: 'dbAgent',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

  return graph.compile()
}
