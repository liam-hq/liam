import { DEFAULT_RECURSION_LIMIT } from '../constants'
import type { AgentWorkflowParams, WorkflowConfigurable } from '../types'
import { setupStreamOptions, setupWorkflowState } from '../utils/workflowSetup'
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

  const stateResult = await setupWorkflowState(
    params,
    config.configurable.repositories,
  )
  if (stateResult.isErr()) {
    throw stateResult.error
  }

  const workflowState = stateResult.value
  const streamOptions = setupStreamOptions({
    organizationId: params.organizationId,
    buildingSchemaId: params.buildingSchemaId,
    designSessionId: params.designSessionId,
    userId: params.userId,
    latestVersionNumber: params.latestVersionNumber,
    repositories: config.configurable.repositories,
    thread_id: config.configurable.thread_id,
    recursionLimit,
    signal: params.signal,
  })

  // Convert workflow state to DB agent state format
  const prompt = params.userInput

  const dbAgentState = {
    ...workflowState,
    prompt,
  }

  const stream = compiled.streamEvents(dbAgentState, {
    ...streamOptions,
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
