import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../../utils/errorHandling'
import { generateTestcaseNode } from './generateTestcaseNode'
import { routeAfterGenerate } from './routeAfterGenerate'
import { saveToolNode } from './saveToolNode'
import { testcaseAnnotation } from './testcaseAnnotation'
import { validateSchemaRequirementsNode } from './validateSchemaRequirementsNode'

const graph = new StateGraph(testcaseAnnotation)

graph
  .addNode('validateSchemaRequirements', validateSchemaRequirementsNode, {
    retryPolicy: RETRY_POLICY,
    ends: ['generateTestcase', END],
  })
  .addNode('generateTestcase', generateTestcaseNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addNode('invokeSaveTool', saveToolNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addEdge(START, 'validateSchemaRequirements')
  .addConditionalEdges('generateTestcase', routeAfterGenerate, {
    invokeSaveTool: 'invokeSaveTool',
    [END]: END,
  })
  .addEdge('invokeSaveTool', 'generateTestcase')

export const testcaseGeneration = graph.compile()
