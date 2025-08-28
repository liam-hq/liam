import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { designSchemaNode } from './nodes/designSchemaNode'
import { invokeSchemaDesignToolNode } from './nodes/invokeSchemaDesignToolNode'
import { routeAfterDesignSchema } from './routing/routeAfterDesignSchema'
import { dbAgentAnnotation } from './shared/dbAgentAnnotation'

/**
 * Retry policy configuration for DB Agent nodes
 */
const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
}

/**
 * Create and configure the DB Agent subgraph for database schema design
 *
 * The DB Agent handles the iterative design process:
 * 1. designSchema - Uses AI to design database schema
 * 2. invokeSchemaDesignTool - Applies schema changes using tools
 * 3. Loop between design and tool invocation until schema is complete
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createDbAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const dbAgentGraph = new StateGraph(dbAgentAnnotation)

  dbAgentGraph
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeSchemaDesignTool', invokeSchemaDesignToolNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'designSchema')
    .addEdge('invokeSchemaDesignTool', 'designSchema')
    .addConditionalEdges('designSchema', routeAfterDesignSchema, {
      invokeSchemaDesignTool: 'invokeSchemaDesignTool',
      generateTestcase: END,
    })

  return checkpointer
    ? dbAgentGraph.compile({ checkpointer })
    : dbAgentGraph.compile()
}
