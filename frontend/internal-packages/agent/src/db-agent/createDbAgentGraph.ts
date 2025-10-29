import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { RETRY_POLICY } from '../utils/errorHandling'
import { designSchemaNode } from './nodes/designSchemaNode'
import { invokeSchemaDesignToolNode } from './nodes/invokeSchemaDesignToolNode'
import { routeAfterDesignSchema } from './routing/routeAfterDesignSchema'
import { dbAgentAnnotation } from './shared/dbAgentAnnotation'

/**
 * Create and configure the DB Agent subgraph for database schema design
 *
 * The DB Agent follows the ReAct pattern for iterative schema design:
 * 1. designSchema - Uses AI to design database schema and decide next action
 * 2. invokeSchemaDesignTool - Applies schema changes using tools
 * 3. Return to designSchema after each tool execution
 * 4. AI decides when design is complete by not calling tools
 *
 * This allows for multi-step schema construction where complex schemas can be
 * built incrementally (e.g., users → posts → comments) with explanations
 * between each step.
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
    .addConditionalEdges('designSchema', routeAfterDesignSchema, {
      invokeSchemaDesignTool: 'invokeSchemaDesignTool',
      designSchema: 'designSchema', // Self-loop for retry
      [END]: END, // Complete when AI decides no more tool calls needed
    })
    // Always return to designSchema after tool execution for multi-step design
    .addEdge('invokeSchemaDesignTool', 'designSchema')

  return checkpointer
    ? dbAgentGraph.compile({ checkpointer })
    : dbAgentGraph.compile()
}
