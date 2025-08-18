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
    streamMode: 'custom',
    version: 'v2',
  })

  async function* iter() {
    for await (const ev of stream) {
      yield ev
    }
  }

  return iter()
}
