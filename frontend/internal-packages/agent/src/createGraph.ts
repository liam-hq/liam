import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { END, Send, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import {
  convertRequirementsToPrompt,
  convertRequirementToPrompt,
} from './db-agent/utils/convertAnalyzedRequirementsToPrompt'
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

    // Handle single requirement when prompt is provided via Send
    const prompt =
      state.prompt ||
      convertRequirementsToPrompt(
        state.analyzedRequirements,
        state.schemaIssues,
      )

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
    .addConditionalEdges('pmAgent', fanOutDbAgent)
    // .addEdge('pmAgent', 'dbAgent')
    .addEdge('dbAgent', 'qaAgent')
    .addEdge('qaAgent', 'leadAgent')

  return checkpointer ? graph.compile({ checkpointer }) : graph.compile()
}

export function fanOutDbAgent(state: WorkflowState) {
  const sends: Send[] = []
  const allCategories = new Set<string>()

  // Collect all unique category names
  for (const [categoryName, requirements] of Object.entries(
    state.analyzedRequirements.functionalRequirements,
  )) {
    if (requirements.length > 0) {
      allCategories.add(categoryName)
    }
  }

  for (const [categoryName, requirements] of Object.entries(
    state.analyzedRequirements.nonFunctionalRequirements,
  )) {
    if (requirements.length > 0) {
      allCategories.add(categoryName)
    }
  }

  // Process each unique category
  for (const categoryName of allCategories) {
    const prompt = convertRequirementToPrompt(
      state.analyzedRequirements,
      categoryName,
    )
    sends.push(
      new Send('dbAgent', {
        ...state,
        prompt,
        currentRequirementCategory: categoryName,
      }),
    )
  }

  // If no requirements found, send the full prompt
  if (sends.length === 0) {
    const prompt = convertRequirementsToPrompt(
      state.analyzedRequirements,
      state.schemaIssues,
    )
    return new Send('dbAgent', { ...state, prompt })
  }

  return sends
}
