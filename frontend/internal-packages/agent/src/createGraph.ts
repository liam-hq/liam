import { END, START, StateGraph } from '@langchain/langgraph'
import {
  analyzeRequirementsNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  preAssessmentNode,
  prepareDmlNode,
  saveRequirementToArtifactNode,
  validateSchemaNode,
} from './chat/workflow/nodes'
import { routeAfterPreAssessment } from './chat/workflow/routing/routeAfterPreAssessment'
import { createAnnotations } from './chat/workflow/shared/langGraphUtils'
import { createDbAgentGraph } from './db-agent/createDbAgentGraph'
import { RETRY_POLICY } from './shared/errorHandling'

/**
 * Create and configure the LangGraph workflow
 */
export const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  // Create DB Agent subgraph
  const dbAgentSubgraph = createDbAgentGraph()

  graph
    .addNode('preAssessment', preAssessmentNode, {
      retryPolicy: RETRY_POLICY,
    })
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

    .addEdge(START, 'preAssessment')
    .addEdge('saveRequirementToArtifact', 'dbAgent')
    .addEdge('dbAgent', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edges for pre-assessment
    .addConditionalEdges(
      'preAssessment',
      (state) => {
        const MAX_RETRIES = 3
        const retryCount = state.retryCount['preAssessment'] || 0

        if (state.preAssessmentResult !== undefined) {
          return routeAfterPreAssessment(state)
        }

        // If max retries exceeded → fallback to finalizeArtifacts
        if (retryCount >= MAX_RETRIES) {
          return 'finalizeArtifacts'
        }

        // Otherwise → retry preAssessment
        return 'preAssessment'
      },
      {
        preAssessment: 'preAssessment',
        analyzeRequirements: 'analyzeRequirements',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

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

  return graph.compile()
}
