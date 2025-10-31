import { deepModeling } from '@liam-hq/agent'
import { err, ok, type Result } from '@liam-hq/neverthrow'
import { aSchema } from '@liam-hq/schema'
import { handleExecutionResult, logInputProcessing } from '../utils.ts'
import { setupRepositories } from './setupRepositories.ts'
import type { LiamDbExecutorInput, LiamDbExecutorOutput } from './types.ts'

export async function execute(
  input: LiamDbExecutorInput,
): Promise<Result<LiamDbExecutorOutput, Error>> {
  logInputProcessing(input.input)

  // Setup Supabase repositories
  const setupResult = await setupRepositories()
  if (setupResult.isErr()) {
    return err(
      new Error(`Failed to setup repositories: ${setupResult.error.message}`),
    )
  }

  const {
    repositories,
    organizationId,
    buildingSchemaId,
    designSessionId,
    userId,
  } = setupResult.value

  // Create workflow params
  const workflowParams = {
    userInput: input.input,
    schemaData: aSchema({ tables: {} }),
    organizationId,
    buildingSchemaId,
    designSessionId,
    userId,
    signal: new AbortController().signal,
  }

  const config = {
    configurable: {
      repositories,
      thread_id: designSessionId,
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
    finalWorkflowState.designSessionId,
  )

  if (latestSchemaResult.isOk()) {
    finalSchemaData = latestSchemaResult.value.schema
  }

  return ok(finalSchemaData)
}
