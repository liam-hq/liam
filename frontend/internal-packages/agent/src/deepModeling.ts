import { DEFAULT_RECURSION_LIMIT } from './constants'
import { createGraph } from './createGraph'
import type {
  AgentWorkflowParams,
  AgentWorkflowResult,
  WorkflowConfigurable,
} from './types'
import {
  executeWorkflowWithTracking,
  setupStreamOptions,
  setupWorkflowState,
} from './utils/workflowSetup'

/**
 * Execute Deep Modeling workflow
 */
export const deepModeling = (
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
): AgentWorkflowResult => {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createGraph(
    config.configurable.repositories.schema.checkpointer,
  )

  return setupWorkflowState(params, config.configurable.repositories).andThen(
    (workflowState) => {
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
      return executeWorkflowWithTracking(compiled, workflowState, streamOptions)
    },
  )
}
