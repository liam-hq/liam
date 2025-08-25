import type { RunnableConfig } from '@langchain/core/runnables'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { workflowAnnotation } from './chat/workflow/shared/createAnnotations'
import type { WorkflowState } from './chat/workflow/types'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import { createLeadAgentGraph } from './lead-agent/createLeadAgentGraph'
import { createPmAgentGraph } from './pm-agent/createPmAgentGraph'
import { createQaAgentGraph } from './qa-agent/createQaAgentGraph'

/**
 * Create and configure the LangGraph workflow
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createGraph = (checkpointer?: BaseCheckpointSaver) => {
  const graph = new StateGraph(workflowAnnotation)
  const leadAgentSubgraph = createLeadAgentGraph(checkpointer)
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
    .addNode('leadAgent', leadAgentSubgraph)
    .addNode('pmAgent', callPmAgent)
    .addNode('dbAgent', dbAgentSubgraph)
    .addNode('qaAgent', qaAgentSubgraph)

    .addEdge(START, 'leadAgent')
    .addConditionalEdges('leadAgent', (state) => state.next, {
      pmAgent: 'pmAgent',
      [END]: END,
    })
    .addEdge('pmAgent', 'dbAgent')
    .addEdge('dbAgent', 'qaAgent')
    // Route back to Lead Agent after QA Agent completes
    // Lead Agent will finalize the workflow
    .addEdge('qaAgent', 'leadAgent')

  return checkpointer ? graph.compile({ checkpointer }) : graph.compile()
}
