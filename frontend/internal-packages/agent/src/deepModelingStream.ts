import { createGraph } from './createGraph'
import type { AgentWorkflowParams, WorkflowConfigurable } from './types'
import { DEFAULT_RECURSION_LIMIT } from './utils/constants'
import { setupWorkflowState } from './utils/workflowSetup'

// TODO: Move to deepModeling.ts once the streaming migration is established
export async function deepModelingStream(
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
) {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createGraph(
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access
    tags: (traceEnhancement as any)['tags'],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access
    metadata: (traceEnhancement as any)['metadata'],
    streamMode: 'messages',
    version: 'v2',
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
