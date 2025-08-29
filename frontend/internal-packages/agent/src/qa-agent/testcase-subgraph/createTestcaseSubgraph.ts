import { Command, END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../../shared/errorHandling'
import { testcaseAnnotation } from './annotations'
import { generateTestcaseNode } from './nodes/generateTestcaseNode'
import { invokeSaveToolNode } from './nodes/invokeSaveToolNode'
import { routeAfterGenerate } from './routing/routeAfterGenerate'

/**
 * Prepare results to be returned to parent graph
 */
const prepareResults = (state: typeof testcaseAnnotation.State) => {
  // Return the generated testcases to be aggregated by the parent graph
  return new Command({
    update: {
      generatedTestcases: state.generatedTestcases,
    },
  })
}

/**
 * Create Testcase Subgraph
 * This subgraph handles testcase generation for a single requirement
 * with isolated message state for proper retry logic
 */
export const createTestcaseSubgraph = () => {
  const testcaseSubgraph = new StateGraph(testcaseAnnotation)

  testcaseSubgraph
    // Add nodes
    .addNode('generateTestcase', generateTestcaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeSaveTool', invokeSaveToolNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareResults', prepareResults)

    // Define flow
    .addEdge(START, 'generateTestcase')

    // Conditional edge for tool execution or completion
    .addConditionalEdges('generateTestcase', routeAfterGenerate, {
      invokeSaveTool: 'invokeSaveTool',
      [END]: 'prepareResults',
    })

    // Loop back for retry after tool execution
    .addEdge('invokeSaveTool', 'generateTestcase')

    // Return results to parent
    .addEdge('prepareResults', END)

  return testcaseSubgraph.compile()
}
