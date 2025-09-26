import { randomUUID } from 'node:crypto'
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector'
import { DEFAULT_RECURSION_LIMIT } from '../constants'
import type { Repositories } from '../repositories'
import { createEnhancedTraceData } from './traceEnhancer'

type SetupStreamOptionsParams = {
  organizationId: string
  buildingSchemaId: string
  designSessionId: string
  userId: string
  repositories: Repositories
  threadId: string
  signal: AbortSignal
  recursionLimit?: number
  checkpointId?: string
  subgraphs?: boolean
}

export type ReplayStreamParams = SetupStreamOptionsParams & {
  checkpointId: string
}

export const setupStreamOptions = ({
  organizationId,
  buildingSchemaId,
  designSessionId,
  userId,
  repositories,
  threadId: thread_id,
  signal,
  recursionLimit = DEFAULT_RECURSION_LIMIT,
  checkpointId,
  subgraphs = false,
}: SetupStreamOptionsParams) => {
  const runCollector = new RunCollectorCallbackHandler()

  const traceEnhancement = createEnhancedTraceData(
    'agent-workflow',
    [`organization:${organizationId}`, `session:${designSessionId}`],
    {
      workflow: {
        building_schema_id: buildingSchemaId,
        design_session_id: designSessionId,
        user_id: userId,
        organization_id: organizationId,
      },
    },
  )

  const configurable = {
    repositories,
    thread_id,
    buildingSchemaId,
    // TODO: Remove this field because it's not used
    latestVersionNumber: 0,
    ...(checkpointId ? { checkpoint_id: checkpointId } : {}),
  }

  return {
    recursionLimit,
    configurable,
    callbacks: [runCollector],
    tags: traceEnhancement.tags,
    metadata: traceEnhancement.metadata,
    streamMode: 'messages' as const,
    version: 'v2' as const,
    signal,
    runId: randomUUID(),
    ...(subgraphs ? { subgraphs: true } : {}),
  }
}
