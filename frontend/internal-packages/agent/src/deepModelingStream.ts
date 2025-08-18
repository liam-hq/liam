import { DEFAULT_RECURSION_LIMIT } from './chat/workflow/shared/langGraphUtils'
import type { WorkflowConfigurable } from './chat/workflow/types'
import { createGraph } from './createGraph'
import { setupWorkflowState } from './shared/workflowSetup'
import { transformEvent } from './stream/transformEvent'
import type { AgentWorkflowParams } from './types'

// TODO: Move to deepModeling.ts once the streaming migration is established
export async function deepModelingStream(
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
) {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createGraph()

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
    streamMode: 'custom',
    version: 'v2',
  })

  async function* iter() {
    for await (const ev of stream) {
      const t = transformEvent(ev)
      if (t) yield t
    }
  }

  return iter()
}
