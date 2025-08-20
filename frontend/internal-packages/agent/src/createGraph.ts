import type { RunnableConfig } from '@langchain/core/runnables'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import {
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  validateSchemaNode,
} from './chat/workflow/nodes'
import { createAnnotations } from './chat/workflow/shared/createAnnotations'
import type { WorkflowState } from './chat/workflow/types'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import { createPmAgentGraph } from './pm-agent/createPmAgentGraph'
import { RETRY_POLICY } from './shared/errorHandling'

/**
 * Create and configure the LangGraph workflow
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createGraph = (checkpointer?: BaseCheckpointSaver) => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)
  const dbAgentSubgraph = createDbAgentGraph(checkpointer)

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

    .addEdge(START, 'pmAgent')
    .addEdge('pmAgent', 'dbAgent')
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
        return state.dmlExecutionErrors ? 'dbAgent' : 'finalizeArtifacts'
      },
      {
        dbAgent: 'dbAgent',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

  return checkpointer ? graph.compile({ checkpointer }) : graph.compile()
}
