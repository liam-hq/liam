import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { workflowAnnotation } from '../chat/workflow/shared/workflowAnnotation'
import { RETRY_POLICY } from '../shared/errorHandling'
import {
  continueToRequirements,
  distributeRequirements,
} from './distributeRequirements'
import { createTestcaseSubgraph } from './testcase-subgraph/createTestcaseSubgraph'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const qaAgentGraph = new StateGraph(workflowAnnotation)

  // Create testcase subgraph instance
  const testcaseSubgraph = createTestcaseSubgraph()

  qaAgentGraph
    // Add nodes for map-reduce pattern
    .addNode('distributeRequirements', distributeRequirements, {
      retryPolicy: RETRY_POLICY,
    })

    // Add testcase subgraph for parallel processing
    .addNode('testcaseSubgraph', testcaseSubgraph)

    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })

    // Define edges for map-reduce flow
    .addEdge(START, 'distributeRequirements')

    // Use conditional edge with Send API for parallel execution
    // Send targets the testcaseSubgraph
    .addConditionalEdges('distributeRequirements', continueToRequirements)

    // After all parallel subgraph executions complete, validate
    .addEdge('testcaseSubgraph', 'validateSchema')

    // End after validation
    .addEdge('validateSchema', END)

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
