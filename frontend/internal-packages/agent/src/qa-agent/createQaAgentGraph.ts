import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { workflowAnnotation } from '../chat/workflow/shared/createAnnotations'
import { RETRY_POLICY } from '../shared/errorHandling'
import { generateTestcaseNode } from './generateTestcase'
import { prepareDmlNode } from './prepareDml'
import { validateSchemaNode } from './validateSchema'

/**
 * Create and configure the QA Agent subgraph for test case generation and validation
 *
 * The QA Agent handles the testing and validation process:
 * 1. generateTestcase - Creates test cases for testing with automatic timeline sync
 * 2. prepareDML - Generates DML statements for testing
 * 3. validateSchema - Executes DML and validates schema
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createQaAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const qaAgentGraph = new StateGraph(workflowAnnotation)

  qaAgentGraph
    .addNode('generateTestcase', generateTestcaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'generateTestcase')
    .addEdge('generateTestcase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('validateSchema', END)

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
