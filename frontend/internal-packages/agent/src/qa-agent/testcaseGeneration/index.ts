import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../../utils/errorHandling'
import { executeSingleTestNode } from './executeSingleTestNode'
import { generateTestcaseNode } from './generateTestcaseNode'
import { invokeSingleTestToolNode } from './invokeSingleTestToolNode'
import { routeAfterGenerate } from './routeAfterGenerate'
import { routeAfterSave } from './routeAfterSave'
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
  .addNode('executeSingleTest', executeSingleTestNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addNode('invokeSingleTestTool', invokeSingleTestToolNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addEdge(START, 'validateSchemaRequirements')
  .addConditionalEdges('generateTestcase', routeAfterGenerate, {
    invokeSaveTool: 'invokeSaveTool',
    [END]: END,
  })
  .addConditionalEdges('invokeSaveTool', routeAfterSave, {
    generateTestcase: 'generateTestcase',
    executeSingleTest: 'executeSingleTest',
    [END]: END,
  })
  .addEdge('executeSingleTest', 'invokeSingleTestTool')
  .addEdge('invokeSingleTestTool', END)

export const testcaseGeneration = graph.compile()
