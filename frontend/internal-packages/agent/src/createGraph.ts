import { END, START, StateGraph } from '@langchain/langgraph'
import {
  analyzeRequirementsNode,
  executeDdlNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  validateSchemaNode,
  webSearchNode,
} from './chat/workflow/nodes/index.ts'
import { createAnnotations } from './chat/workflow/shared/langGraphUtils.ts'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph.ts'

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
    .addNode('dbAgent', dbAgentSubgraph)
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
    .addNode('finalizeArtifacts', finalizeArtifactsNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'webSearch')
    .addEdge('webSearch', 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'dbAgent')
    .addEdge('dbAgent', 'executeDDL')
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edge for executeDDL - retry with DB Agent if DDL execution fails
    .addConditionalEdges(
      'executeDDL',
      (state) => {
        if (state.shouldRetryWithDesignSchema) {
          return 'dbAgent'
        }
        if (state.ddlExecutionFailed) {
          return 'finalizeArtifacts'
        }
        return 'generateUsecase'
      },
      {
        dbAgent: 'dbAgent',
        finalizeArtifacts: 'finalizeArtifacts',
        generateUsecase: 'generateUsecase',
      },
    )

    // Conditional edges for validation results
    .addConditionalEdges(
      'validateSchema',
      (state) => {
        // success → finalizeArtifacts
        // dml error or test fail → dbAgent
        return state.error ? 'dbAgent' : 'finalizeArtifacts'
      },
      {
        dbAgent: 'dbAgent',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

  return graph.compile()
}
