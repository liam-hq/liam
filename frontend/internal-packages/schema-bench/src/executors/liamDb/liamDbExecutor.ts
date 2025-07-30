import { deepModeling, InMemoryRepository } from '@liam-hq/agent'
import { aSchema } from '@liam-hq/db-structure'
import { err, ok, type Result } from 'neverthrow'
import { handleExecutionResult, logInputProcessing } from '../utils.ts'
import type { LiamDbExecutorInput, LiamDbExecutorOutput } from './types.ts'

export async function execute(
  input: LiamDbExecutorInput,
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
      designSessions: {
        'demo-design-session': {},
      },
      workflowRuns: {},
    }),
  }

  // Create workflow state
  const workflowState = {
    userInput: input.input,
    messages: [],
    schemaData: aSchema({ tables: {} }),
    history: [] satisfies [string, string][],
    organizationId: 'demo-org-id',
    buildingSchemaId: 'demo-design-session',
    latestVersionNumber: 1,
    designSessionId: 'demo-design-session',
    userId: 'demo-user-id',
    retryCount: {},
  }

  const config = {
    configurable: {
      repositories,
    },
  }

  // Execute deep modeling workflow
  const result = await deepModeling(workflowState, config)
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
