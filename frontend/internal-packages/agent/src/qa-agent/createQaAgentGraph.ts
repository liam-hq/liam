import { END, START, StateGraph } from '@langchain/langgraph'
import { RETRY_POLICY } from '../utils/errorHandling'
import {
  continueToRequirements,
  prepareTestcaseGeneration,
} from './distributeRequirements'
import { analyzeTestFailuresNode } from './nodes/analyzeTestFailuresNode'
import { applyGeneratedSqlsNode } from './nodes/applyGeneratedSqlsNode'
import { invokeRunTestToolNode } from './nodes/invokeRunTestToolNode'
import { resetFailedSqlTestsNode } from './nodes/resetFailedSqlTestsNode'
import { routeAfterAnalyzeFailures } from './routing/routeAfterAnalyzeFailures'
import { qaAgentAnnotation } from './shared/qaAgentAnnotation'
import { testcaseGeneration } from './testcaseGeneration'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = () => {
  const qaAgentGraph = new StateGraph(qaAgentAnnotation)

  qaAgentGraph
    // Add nodes for map-reduce pattern
    .addNode('prepareTestcaseGeneration', prepareTestcaseGeneration)
    .addNode('testcaseGeneration', testcaseGeneration)

    .addNode('applyGeneratedSqls', applyGeneratedSqlsNode)

    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeRunTestTool', invokeRunTestToolNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('analyzeTestFailures', analyzeTestFailuresNode)
    .addNode('resetFailedSqlTests', resetFailedSqlTestsNode)

    // Define edges for map-reduce flow
    // START → prepareTestcaseGeneration to add start message to state
    .addEdge(START, 'prepareTestcaseGeneration')

    // Use conditional edge with Send API for parallel execution
    // Send targets the testcaseGeneration subgraph
    .addConditionalEdges('prepareTestcaseGeneration', continueToRequirements)

    // After all parallel subgraph executions complete, apply generated SQLs
    .addEdge('testcaseGeneration', 'applyGeneratedSqls')

    // Then validate
    .addEdge('applyGeneratedSqls', 'validateSchema')

    // Add new test execution step after validation
    .addEdge('validateSchema', 'invokeRunTestTool')

    // After test execution, analyze failures
    .addEdge('invokeRunTestTool', 'analyzeTestFailures')

    // Route based on failure analysis
    .addConditionalEdges('analyzeTestFailures', routeAfterAnalyzeFailures, {
      resetFailedSqlTests: 'resetFailedSqlTests',
      [END]: END,
    })

    // After resetting failed SQL tests, prepare again before regenerating
    .addEdge('resetFailedSqlTests', 'prepareTestcaseGeneration')

  return qaAgentGraph.compile()
}
