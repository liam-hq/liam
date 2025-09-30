import { deepModeling, InMemoryRepository } from '@liam-hq/agent'
import { aSchema } from '@liam-hq/schema'
import { err, ok, type Result } from 'neverthrow'
import type { TraceContext } from '../../tracing/types'
import { handleExecutionResult, logInputProcessing } from '../utils.ts'
import type { LiamDbExecutorInput, LiamDbExecutorOutput } from './types.ts'

export async function execute(
  input: LiamDbExecutorInput,
  options?: { traceContext?: TraceContext },
): Promise<Result<LiamDbExecutorOutput, Error>> {
  logInputProcessing(input.input)

  // Setup InMemory repository
  const repositories = {
    schema: new InMemoryRepository({
      schemas: {
        'demo-design-session': aSchema({
          tables: {},
        }),
      },
    }),
  }

  // Create workflow params
  const workflowParams = {
    userInput: input.input,
    schemaData: aSchema({ tables: {} }),
    organizationId: 'demo-org-id',
    buildingSchemaId: 'demo-design-session',
    designSessionId: 'demo-design-session',
    userId: 'demo-user-id',
    signal: new AbortController().signal,
  }

  const computeThreadId = (): string => {
    if (options?.traceContext?.threadId) return options.traceContext.threadId
    const parts = [
      options?.traceContext?.datasetName,
      options?.traceContext?.caseId,
      options?.traceContext?.runId,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(':') : 'demo-design-session'
  }

  const config = {
    configurable: {
      repositories,
      thread_id: computeThreadId(),
    },
  }

  // Execute deep modeling workflow
  const result = await deepModeling(workflowParams, config)
  const handledResult = handleExecutionResult(result, 'Deep modeling failed')

  if (handledResult.isErr()) {
    return err(handledResult.error)
  }

  const finalWorkflowState = handledResult.value

  // Get the latest schema from repository
  let finalSchemaData = finalWorkflowState.schemaData
  const latestSchemaResult = await repositories.schema.getSchema(
    finalWorkflowState.buildingSchemaId,
  )

  if (latestSchemaResult.isOk()) {
    finalSchemaData = latestSchemaResult.value.schema
  }

  return ok(finalSchemaData)
}
