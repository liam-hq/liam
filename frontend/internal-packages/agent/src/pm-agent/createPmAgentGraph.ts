import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { RETRY_POLICY } from '../utils/errorHandling'
import { analyzeRequirementsNode } from './nodes/analyzeRequirementsNode'
import { invokeSaveArtifactToolNode } from './nodes/invokeSaveArtifactToolNode'
import { pmAgentStateAnnotation } from './pmAgentAnnotations'
import { routeAfterAnalyzeRequirements } from './routing/routeAfterAnalyzeRequirements'

/**
 * Create and configure the PM Agent subgraph for requirements analysis
 *
 * The PM Agent handles the requirements analysis process:
 * 1. analyzeRequirements - Analyzes and structures user requirements
 * 2. invokeSaveArtifactTool - Saves requirements as artifacts using tools
 * 3. Loop between analysis and tool invocation until requirements are saved
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createPmAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const pmAgentGraph = new StateGraph(pmAgentStateAnnotation)

  pmAgentGraph
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeSaveArtifactTool', invokeSaveArtifactToolNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'analyzeRequirements')
    .addEdge('invokeSaveArtifactTool', 'analyzeRequirements')
    .addConditionalEdges('analyzeRequirements', routeAfterAnalyzeRequirements, {
      invokeSaveArtifactTool: 'invokeSaveArtifactTool',
      END: END,
      analyzeRequirements: 'analyzeRequirements',
    })

  return checkpointer
    ? pmAgentGraph.compile({ checkpointer })
    : pmAgentGraph.compile()
}
