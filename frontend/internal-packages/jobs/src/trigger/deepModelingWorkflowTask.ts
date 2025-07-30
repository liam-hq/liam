import type { AgentWorkflowParams, AgentWorkflowResult } from '@liam-hq/agent'
import { createSupabaseRepositories, deepModeling } from '@liam-hq/agent'
import { logger, task } from '@trigger.dev/sdk'
import { errAsync, ResultAsync } from 'neverthrow'
import { createClient } from '../libs/supabase'

// Define type excluding schemaData (repositories are now passed via config)
export type DeepModelingPayload = Omit<AgentWorkflowParams, 'schemaData'>

export const deepModelingWorkflowTask = task({
  id: 'deep-modeling-workflow',
  machine: 'medium-1x',
  run: async (
    payload: DeepModelingPayload,
  ): Promise<ResultAsync<AgentWorkflowResult, Error>> => {
    logger.log('Starting Deep Modeling workflow:', {
      buildingSchemaId: payload.buildingSchemaId,
      messageLength: payload.userInput.length,
      timestamp: new Date().toISOString(),
    })

    // Create fresh repositories in job to avoid serialization issues
    // When repositories are passed from API Route to Job, class instances lose their methods
    // during JSON serialization/deserialization, causing "createMessage is not a function" errors
    const supabaseClientResult = createClient()

    if (supabaseClientResult.isErr()) {
      return errAsync(supabaseClientResult.error)
    }
    const repositories = createSupabaseRepositories(supabaseClientResult.value)

    return repositories.schema
      .getSchema(payload.designSessionId)
      .andThen((schemaResult) => {
        const deepModelingParams: AgentWorkflowParams = {
          ...payload,
          schemaData: schemaResult.schema,
        }

        return ResultAsync.fromPromise(
          deepModeling(deepModelingParams, {
            configurable: {
              repositories,
            },
          }),
          (err) => new Error(String(err)),
        )
      })
      .map((result) => {
        logger.log('Deep Modeling workflow completed:', {
          success: result.isOk(),
        })

        return result
      })
  },
})
