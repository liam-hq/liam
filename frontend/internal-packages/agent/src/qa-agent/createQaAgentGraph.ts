import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { RETRY_POLICY } from '../utils/errorHandling'
import { continueToRequirements } from './distributeRequirements'
import { invokeRunTestToolNode } from './nodes/invokeRunTestToolNode'
import { routeAfterValidation } from './nodes/routeAfterValidation'
import { updateTestcasesNode } from './nodes/updateTestcasesNode'
import { qaAgentAnnotation } from './shared/qaAgentAnnotation'
import { testcaseGeneration } from './testcaseGeneration'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const qaAgentGraph = new StateGraph(qaAgentAnnotation)

  qaAgentGraph
    // Add nodes for map-reduce pattern
    .addNode('testcaseGeneration', testcaseGeneration)

    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeRunTestTool', invokeRunTestToolNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('updateTestcases', updateTestcasesNode, {
      retryPolicy: RETRY_POLICY,
    })

    // Define edges for map-reduce flow
    // Use conditional edge with Send API for parallel execution from START
    // Send targets the testcaseGeneration
    .addConditionalEdges(START, continueToRequirements)

    // After all parallel subgraph executions complete, validate
    .addEdge('testcaseGeneration', 'validateSchema')

    // Add test execution step after validation
    .addEdge('validateSchema', 'invokeRunTestTool')

    // Add conditional routing after test execution for auto-healing
    .addConditionalEdges('invokeRunTestTool', routeAfterValidation, {
      updateTestcases: 'updateTestcases',
      [END]: END,
    })

    // Create healing loop - updateTestcases goes back to validation
    .addEdge('updateTestcases', 'validateSchema')

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
