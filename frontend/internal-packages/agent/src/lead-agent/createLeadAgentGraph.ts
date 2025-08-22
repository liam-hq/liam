import type { RunnableConfig } from '@langchain/core/runnables'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { workflowAnnotation } from '../chat/workflow/shared/createAnnotations'
import type { WorkflowState } from '../chat/workflow/types'
import { RETRY_POLICY } from '../shared/errorHandling'
import { callModelNode } from './nodes/callModelNode'
import { shouldContinue } from './routing/shouldContinue'
import { runDeepModelingTool } from './tools/runDeepModelingTool'

/**
 * Invoke tools node - wrapper to pass config to ToolNode
 * This follows the same pattern as invokeSaveArtifactToolNode
 */
const invokeToolsNode = async (
  state: WorkflowState,
  config: RunnableConfig,
) => {
  const toolNode = new ToolNode([runDeepModelingTool])

  return toolNode.invoke(state, {
    configurable: {
      ...config.configurable,
      state, // Pass the current state to the tool
    },
  })
}

/**
 * Create and configure the Lead Agent graph using React Agent pattern
 *
 * The React Agent pattern implements a loop between:
 * 1. Agent node - Invokes the model to generate responses or tool calls
 * 2. Tools node - Executes any tool calls from the agent
 *
 * The agent can iteratively call tools until it has enough information
 * to provide a complete response.
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createLeadAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const leadAgentGraph = new StateGraph(workflowAnnotation)
    .addNode('agent', callModelNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('tools', invokeToolsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue, {
      tools: 'tools',
      END: END,
    })
    // Tools always returns to agent for next decision
    .addEdge('tools', 'agent')

  return checkpointer
    ? leadAgentGraph.compile({ checkpointer })
    : leadAgentGraph.compile()
}
