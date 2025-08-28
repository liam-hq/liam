import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import { workflowAnnotation } from '../chat/workflow/shared/createAnnotations'
import { RETRY_POLICY } from '../shared/errorHandling'
import { classifyMessage } from './classifyMessage'
import { summarizeWorkflow } from './summarizeWorkflow'

export const createLeadAgentGraph = (checkpointer?: BaseCheckpointSaver) => {
  const leadAgentGraph = new StateGraph(workflowAnnotation)

  leadAgentGraph
    .addNode('classify', classifyMessage, {
      retryPolicy: RETRY_POLICY,
      // Specify possible destinations for Command-based routing
      ends: ['summarizeWorkflow', END],
    })
    .addNode('summarizeWorkflow', summarizeWorkflow, {
      retryPolicy: RETRY_POLICY,
    })
    .addEdge(START, 'classify')
    // classifyMessage returns a Command that directly specifies the routing
    .addEdge('summarizeWorkflow', END)

  return checkpointer
    ? leadAgentGraph.compile({ checkpointer })
    : leadAgentGraph.compile()
}
