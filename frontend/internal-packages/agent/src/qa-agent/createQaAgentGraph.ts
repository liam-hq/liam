import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../utils/errorHandling'
import { applyGeneratedSqlsNode } from './nodes/applyGeneratedSqlsNode'
import { invokeRunTestToolNode } from './nodes/invokeRunTestToolNode'
import { processBatchedTestcasesNode } from './nodes/processBatchedTestcasesNode'
import { qaAgentAnnotation } from './shared/qaAgentAnnotation'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = () => {
  const qaAgentGraph = new StateGraph(qaAgentAnnotation)

  qaAgentGraph
    .addNode('processBatchedTestcases', processBatchedTestcasesNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addNode('applyGeneratedSqls', applyGeneratedSqlsNode)

    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeRunTestTool', invokeRunTestToolNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'processBatchedTestcases')

    .addEdge('processBatchedTestcases', 'applyGeneratedSqls')

    .addEdge('applyGeneratedSqls', 'validateSchema')

    .addEdge('validateSchema', 'invokeRunTestTool')
    .addEdge('invokeRunTestTool', END)

  return qaAgentGraph.compile()
}
