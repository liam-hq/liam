import type { RunnableConfig } from '@langchain/core/runnables'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { finalizeArtifactsNode } from './chat/workflow/nodes'
import { workflowAnnotation } from './chat/workflow/shared/createAnnotations'
import type { WorkflowState } from './chat/workflow/types'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import { createPmAgentGraph } from './pm-agent/createPmAgentGraph'
import { createQaAgentGraph } from './qa-agent/createQaAgentGraph'
import { RETRY_POLICY } from './shared/errorHandling'

/**
 * Create and configure the LangGraph workflow
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createGraph = (checkpointer?: BaseCheckpointSaver) => {
  const graph = new StateGraph(workflowAnnotation)
  const dbAgentSubgraph = createDbAgentGraph(checkpointer)
  const qaAgentSubgraph = createQaAgentGraph(checkpointer)

  const callPmAgent = async (state: WorkflowState, config: RunnableConfig) => {
    const pmAgentSubgraph = createPmAgentGraph(checkpointer)
    const pmAgentOutput = await pmAgentSubgraph.invoke(
      {
        messages: state.messages,
        analyzedRequirements: state.analyzedRequirements || {
          businessRequirement: '',
          functionalRequirements: {},
          nonFunctionalRequirements: {},
        },
        designSessionId: state.designSessionId,
        schemaData: state.schemaData,
        analyzedRequirementsRetryCount: 0,
      },
      config,
    )

    return { ...state, ...pmAgentOutput }
  }

  graph
    .addNode('pmAgent', callPmAgent)
    .addNode('dbAgent', dbAgentSubgraph)
    .addNode('qaAgent', qaAgentSubgraph)
    .addNode('finalizeArtifacts', finalizeArtifactsNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'pmAgent')
    .addEdge('pmAgent', 'dbAgent')
    .addEdge('dbAgent', 'qaAgent')
    // TODO: Temporarily removed conditional edges to prevent infinite loop when errors route back to dbAgent
    .addEdge('qaAgent', 'finalizeArtifacts')
    .addEdge('finalizeArtifacts', END)

  return checkpointer ? graph.compile({ checkpointer }) : graph.compile()
}
