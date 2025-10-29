import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../utils/errorHandling'
import { applyGeneratedSqlsNode } from './nodes/applyGeneratedSqlsNode'
import { batchTestcaseGenerationNode } from './nodes/batchTestcaseGenerationNode'
import { invokeRunTestToolNode } from './nodes/invokeRunTestToolNode'
import { qaAgentAnnotation } from './shared/qaAgentAnnotation'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = () => {
  const qaAgentGraph = new StateGraph(qaAgentAnnotation)

  qaAgentGraph
    .addNode('batchTestcaseGeneration', batchTestcaseGenerationNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addNode('applyGeneratedSqls', applyGeneratedSqlsNode)

    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeRunTestTool', invokeRunTestToolNode, {
      retryPolicy: RETRY_POLICY,
    })

    // Define edges for sequential flow with batched processing
    .addEdge(START, 'batchTestcaseGeneration')

    // After batched generation completes, apply generated SQLs
    .addEdge('batchTestcaseGeneration', 'applyGeneratedSqls')

    // Then validate
    .addEdge('applyGeneratedSqls', 'validateSchema')

    // Add new test execution step after validation
    .addEdge('validateSchema', 'invokeRunTestTool')
    .addEdge('invokeRunTestTool', END)

  return qaAgentGraph.compile()
}
