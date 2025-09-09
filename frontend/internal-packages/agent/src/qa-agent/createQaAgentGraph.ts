import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { RETRY_POLICY } from '../utils/errorHandling'
import { continueToRequirements } from './distributeRequirements'
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

    // Define edges for map-reduce flow
    // Use conditional edge with Send API for parallel execution from START
    // Send targets the testcaseGeneration
    .addConditionalEdges(START, continueToRequirements)

    // After all parallel subgraph executions complete, validate
    .addEdge('testcaseGeneration', 'validateSchema')

    // End after validation
    .addEdge('validateSchema', END)

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
