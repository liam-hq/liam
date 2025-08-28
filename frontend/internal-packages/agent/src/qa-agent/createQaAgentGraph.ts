import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { workflowAnnotation } from '../chat/workflow/shared/createAnnotations'
import { RETRY_POLICY } from '../shared/errorHandling'
import { generateDmlNode } from './generateDml'
import { generateTestcaseNode } from './generateTestcase'
import { invokeSaveDmlToolNode } from './nodes/invokeSaveDmlToolNode'
import { routeAfterGenerateDml } from './routing/routeAfterGenerateDml'
import { validateSchemaNode } from './validateSchema'

export const createQaAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const qaAgentGraph = new StateGraph(workflowAnnotation)

  qaAgentGraph
    .addNode('generateTestcase', generateTestcaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateDml', generateDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeSaveDmlTool', invokeSaveDmlToolNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'generateTestcase')
    .addEdge('generateTestcase', 'generateDml')
    .addConditionalEdges('generateDml', routeAfterGenerateDml, {
      invokeSaveDmlTool: 'invokeSaveDmlTool',
      validateSchema: 'validateSchema',
    })
    .addEdge('invokeSaveDmlTool', 'generateDml')
    .addEdge('validateSchema', END)

  return checkpointer
    ? qaAgentGraph.compile({ checkpointer })
    : qaAgentGraph.compile()
}
