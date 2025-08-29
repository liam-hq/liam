import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../../shared/errorHandling'
import { generateTestcaseNode } from './generateTestcaseNode'
import { routeAfterGenerate } from './routeAfterGenerate'
import { saveToolNode } from './saveToolNode'
import { testcaseAnnotation } from './testcaseAnnotation'

const graph = new StateGraph(testcaseAnnotation)

graph
  .addNode('generateTestcase', generateTestcaseNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addNode('invokeSaveTool', saveToolNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addEdge(START, 'generateTestcase')
  .addConditionalEdges('generateTestcase', routeAfterGenerate, {
    invokeSaveTool: 'invokeSaveTool',
    [END]: END,
  })
  .addEdge('invokeSaveTool', 'generateTestcase')

export const testcaseGeneration = graph.compile()
