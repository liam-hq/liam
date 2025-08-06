import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import {
  analyzeRequirementsNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  saveRequirementToArtifactNode,
  validateSchemaNode,
} from './chat/workflow/nodes'
import { createAnnotations } from './chat/workflow/shared/langGraphUtils'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import { RETRY_POLICY } from './shared/errorHandling'

/**
 * Create and configure the LangGraph workflow
 * @param checkpointer - Optional checkpointer for state persistence and recovery
 */
export const createGraph = (checkpointer?: BaseCheckpointSaver) => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  // Create DB Agent subgraph
  const dbAgentSubgraph = createDbAgentGraph(checkpointer)

  graph
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('saveRequirementToArtifact', saveRequirementToArtifactNode, {
      retryPolicy: RETRY_POLICY,
    })
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

    .addEdge(START, 'analyzeRequirements')
    .addEdge('saveRequirementToArtifact', 'dbAgent')
    .addEdge('dbAgent', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edges for requirements analysis
    .addConditionalEdges(
      'analyzeRequirements',
      (state) => {
        const MAX_RETRIES = 3
        const retryCount = state.retryCount['analyzeRequirements'] || 0

        // If analyzedRequirements is defined → proceed to saveRequirementToArtifact
        if (state.analyzedRequirements !== undefined) {
          return 'saveRequirementToArtifact'
        }

        // If max retries exceeded → fallback to finalizeArtifacts
        if (retryCount >= MAX_RETRIES) {
          return 'finalizeArtifacts'
        }

        // Otherwise → retry analyzeRequirements
        return 'analyzeRequirements'
      },
      {
        analyzeRequirements: 'analyzeRequirements',
        saveRequirementToArtifact: 'saveRequirementToArtifact',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

    // Conditional edges for validation results
    .addConditionalEdges(
      'validateSchema',
      (state) => {
        // success → finalizeArtifacts
        // dml error or test fail → dbAgent
        return state.dmlExecutionSuccessful === false
          ? 'dbAgent'
          : 'finalizeArtifacts'
      },
      {
        dbAgent: 'dbAgent',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

  return graph.compile(checkpointer ? { checkpointer } : {})
}
