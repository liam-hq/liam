import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../utils/errorHandling'
import { continueToRequirements } from './distributeRequirements'
import { applyGeneratedSqlsNode } from './nodes/applyGeneratedSqlsNode'
import { invokeRunTestToolNode } from './nodes/invokeRunTestToolNode'
import { prepareTestcasesNode } from './nodes/prepareTestcasesNode'
import { reportProgressNode } from './nodes/reportProgressNode'
import { testcaseGenerationWithSemaphoreNode } from './nodes/testcaseGenerationWithSemaphoreNode'
import { qaAgentAnnotation } from './shared/qaAgentAnnotation'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = () => {
  const qaAgentGraph = new StateGraph(qaAgentAnnotation)

  qaAgentGraph
    .addNode('prepareTestcases', prepareTestcasesNode)
    .addNode(
      'testcaseGenerationWithSemaphore',
      testcaseGenerationWithSemaphoreNode,
      {
        retryPolicy: RETRY_POLICY,
      },
    )
    .addNode('reportProgress', reportProgressNode)
    .addNode('applyGeneratedSqls', applyGeneratedSqlsNode)
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeRunTestTool', invokeRunTestToolNode, {
      retryPolicy: RETRY_POLICY,
    })

    // Define edges for Send API parallel flow with progress tracking
    .addEdge(START, 'prepareTestcases')

    // Use conditional edge with Send API for parallel execution from prepareTestcases
    // Send targets the testcaseGenerationWithSemaphore (which wraps testcaseGeneration with semaphore)
    .addConditionalEdges('prepareTestcases', continueToRequirements)

    .addEdge('testcaseGenerationWithSemaphore', 'reportProgress')

    // After all parallel subgraph executions complete, apply generated SQLs
    .addEdge('reportProgress', 'applyGeneratedSqls')

    // Then validate
    .addEdge('applyGeneratedSqls', 'validateSchema')

    // Add new test execution step after validation
    .addEdge('validateSchema', 'invokeRunTestTool')
    .addEdge('invokeRunTestTool', END)

  return qaAgentGraph.compile()
}
