import { DEFAULT_RECURSION_LIMIT } from '../chat/workflow/shared/langGraphUtils'
import type { WorkflowConfigurable } from '../chat/workflow/types'
import { setupWorkflowState } from '../shared/workflowSetup'
import type { AgentWorkflowParams } from '../types'
import { createDbAgentGraph } from './createDbAgentGraph'

// TODO: Move to invokeDBAgent.ts once the streaming migration is established
export async function invokeDbAgentStream(
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
) {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createDbAgentGraph()

  const setupResult = await setupWorkflowState(params, config)
  if (setupResult.isErr()) {
    throw setupResult.error
  }

  const {
    workflowState,
    workflowRunId,
    runCollector,
    configurable,
    traceEnhancement,
  } = setupResult.value

  const stream = compiled.streamEvents(workflowState, {
    recursionLimit,
    configurable,
    runId: workflowRunId,
    callbacks: [runCollector],
    tags: traceEnhancement.tags,
    metadata: traceEnhancement.metadata,
    streamMode: 'updates',
    version: 'v2',
    encoding: 'text/event-stream',
  })

  /**
   * TODO: Transform compiled.streamEvents results into a format that makes it easier to build messages
   * @see https://js.langchain.com/docs/how_to/streaming/#event-reference
    // for await (const ev of stream) {
    //   if (ev.event === 'on_chat_model_stream' && ev.data?.chunk) {

    //     const chunkId = ev.data.chunk.id
    //     const content = ev.data.chunk.content
    //     yield { event: 'assistant', data: { chunkId, content } }
    //   } else {
    //     ....
    //   }
    // }
   */

  return stream
}
