import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import { convertRequirementsToPrompt } from './db-agent/utils/convertAnalyzedRequirementsToPrompt'
import { createLeadAgentGraph } from './lead-agent/createLeadAgentGraph'
import { createPmAgentGraph } from './pm-agent/createPmAgentGraph'
import { createQaAgentGraph } from './qa-agent/createQaAgentGraph'
import type { WorkflowState } from './types'
import { validateInitialSchemaNode } from './workflow/nodes/validateInitialSchemaNode'
import { workflowAnnotation } from './workflowAnnotation'

/**
 * Create and configure the LangGraph workflow
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createGraph = (checkpointer?: BaseCheckpointSaver) => {
  const graph = new StateGraph(workflowAnnotation)
  const leadAgentSubgraph = createLeadAgentGraph(checkpointer)

  const callDbAgent = async (state: WorkflowState, config: RunnableConfig) => {
    const dbAgentSubgraph = createDbAgentGraph(checkpointer)
    const prompt = convertRequirementsToPrompt(state.analyzedRequirements)

    const modifiedState = { ...state, messages: [], prompt }
    const output = await dbAgentSubgraph.invoke(modifiedState, config)

    return { ...state, ...output }
  }

  const callQaAgent = async (state: WorkflowState, config: RunnableConfig) => {
    const qaAgentSubgraph = createQaAgentGraph(checkpointer)
    const modifiedState = { ...state, messages: [] }
    const output = await qaAgentSubgraph.invoke(modifiedState, config)

    return { ...state, ...output }
  }

  const callPmAgent = async (state: WorkflowState, config: RunnableConfig) => {
    const pmAgentSubgraph = createPmAgentGraph(checkpointer)
    const pmAgentOutput = await pmAgentSubgraph.invoke(
      {
        messages: state.messages,
        analyzedRequirements: state.analyzedRequirements,
        designSessionId: state.designSessionId,
        schemaData: state.schemaData,
        analyzedRequirementsRetryCount: 0,
      },
      config,
    )

    return { ...state, ...pmAgentOutput }
  }

  graph
    .addNode('validateInitialSchema', validateInitialSchemaNode)
    .addNode('leadAgent', leadAgentSubgraph)
    .addNode('pmAgent', callPmAgent)
    .addNode('dbAgent', callDbAgent)
    .addNode('qaAgent', callQaAgent)

    .addConditionalEdges(
      START,
      (state) => {
        const isFirstExecution = !state.messages.some(
          (msg) => msg instanceof AIMessage,
        )
        return isFirstExecution ? 'validateInitialSchema' : 'leadAgent'
      },
      {
        validateInitialSchema: 'validateInitialSchema',
        leadAgent: 'leadAgent',
      },
    )
    .addEdge('validateInitialSchema', 'leadAgent')

    .addConditionalEdges('leadAgent', (state) => state.next, {
      pmAgent: 'pmAgent',
      [END]: END,
    })
    .addEdge('pmAgent', 'dbAgent')
    .addEdge('dbAgent', 'qaAgent')
    .addEdge('qaAgent', 'leadAgent')

  return checkpointer ? graph.compile({ checkpointer }) : graph.compile()
}
