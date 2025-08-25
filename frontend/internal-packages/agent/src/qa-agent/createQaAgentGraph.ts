import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import {
  generateUsecaseNode,
  prepareDmlNode,
  validateSchemaNode,
} from '../chat/workflow/nodes'
import { workflowAnnotation } from '../chat/workflow/shared/createAnnotations'
import { RETRY_POLICY } from '../shared/errorHandling'

/**
 * Create and configure the QA Agent subgraph for use case generation and validation
 *
 * The QA Agent handles the testing and validation process:
 * 1. generateUsecase - Creates use cases for testing with automatic timeline sync
 * 2. prepareDML - Generates DML statements for testing
 * 3. validateSchema - Executes DML and validates schema
 *
 * @param checkpointer - Optional checkpoint saver for persistent state management
 */
export const createQaAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const qaAgentGraph = new StateGraph(workflowAnnotation)

  qaAgentGraph
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('validateSchema', END)

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
