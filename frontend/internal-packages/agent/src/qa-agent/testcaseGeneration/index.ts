import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../../utils/errorHandling'
import { generateTestcaseNode } from './generateTestcaseNode'
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
  .addNode(
    'generateTestcase',
    async (state) => {
      // Reset messages on retry to prevent accumulation
      const cleanState = {
        ...state,
        messages: [], // Clear previous messages to prevent accumulation
      }
      console.info(
        '[testcaseGeneration] Executing generateTestcase (messages reset)',
      )
      return generateTestcaseNode(cleanState)
    },
    {
      retryPolicy: {
        ...RETRY_POLICY,
        maxAttempts: 1, // No retries - fail fast after 60s timeout
      },
    },
  )
  .addNode('invokeSaveTool', saveToolNode, {
    retryPolicy: RETRY_POLICY,
  })
  .addEdge(START, 'validateSchemaRequirements')
  .addConditionalEdges('generateTestcase', routeAfterGenerate, {
    invokeSaveTool: 'invokeSaveTool',
    [END]: END,
  })
  .addConditionalEdges('invokeSaveTool', routeAfterSave, {
    generateTestcase: 'generateTestcase',
    [END]: END,
  })

export const testcaseGeneration = graph.compile()
