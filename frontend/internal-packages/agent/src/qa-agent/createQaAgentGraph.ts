import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { RETRY_POLICY } from '../utils/errorHandling'
import { generateTestcaseAndDmlNode } from './generateTestcaseAndDml'
import { invokeSaveTestcasesAndDmlToolNode } from './nodes/invokeSaveTestcasesAndDmlToolNode'
import { routeAfterGenerateTestcaseAndDml } from './routing/routeAfterGenerateTestcaseAndDml'
import { qaAgentAnnotation } from './shared/qaAgentAnnotation'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const qaAgentGraph = new StateGraph(qaAgentAnnotation)

  qaAgentGraph
    .addNode('generateTestcaseAndDml', generateTestcaseAndDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode(
      'invokeSaveTestcasesAndDmlTool',
      invokeSaveTestcasesAndDmlToolNode,
      {
        retryPolicy: RETRY_POLICY,
      },
    )
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'generateTestcaseAndDml')
    .addConditionalEdges(
      'generateTestcaseAndDml',
      routeAfterGenerateTestcaseAndDml,
      {
        invokeSaveTestcasesAndDmlTool: 'invokeSaveTestcasesAndDmlTool',
        validateSchema: 'validateSchema',
      },
    )
    .addEdge('invokeSaveTestcasesAndDmlTool', 'generateTestcaseAndDml')
    .addEdge('validateSchema', END)

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
