import { DEFAULT_RECURSION_LIMIT } from '../constants'
import type { AgentWorkflowParams, WorkflowConfigurable } from '../types'
import { setupWorkflowState } from '../utils/workflowSetup'
import { createDbAgentGraph } from './createDbAgentGraph'

// TODO: Move to invokeDBAgent.ts once the streaming migration is established
export async function invokeDbAgentStream(
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
) {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createDbAgentGraph(
    config.configurable.repositories.schema.checkpointer,
  )

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
    streamMode: 'messages',
    version: 'v2',
    subgraphs: true,
  })

  async function* iter() {
    for await (const ev of stream) {
      if (ev.event === 'on_custom_event') {
        yield {
          event: ev.name,
          data: [ev.data, ev.metadata],
        }
      }
    }
  }

  return iter()
}
