import { END, START, StateGraph } from '@langchain/langgraph'
import { analyzeRequirementsNode, prepareDmlNode } from './chat/workflow/nodes'
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
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('dbAgent', dbAgentSubgraph)
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'dbAgent')
    .addEdge('dbAgent', 'prepareDML')
    .addEdge('prepareDML', END)

  return graph.compile()
}
