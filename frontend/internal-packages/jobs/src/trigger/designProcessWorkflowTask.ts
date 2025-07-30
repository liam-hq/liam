import type { AgentWorkflowParams } from '@liam-hq/agent'
import { createSupabaseRepositories, invokeDbAgent } from '@liam-hq/agent'
import { task } from '@trigger.dev/sdk'
import { createClient } from '../libs/supabase'

export type DesignProcessPayload = Omit<AgentWorkflowParams, 'schemaData'>

export const designProcessWorkflowTask = task({
  id: 'design-process-workflow',
  machine: 'medium-1x',
  run: async (payload: DesignProcessPayload): Promise<void> => {
    const supabaseClientResult = createClient()
    if (supabaseClientResult.isErr()) {
      throw supabaseClientResult.error
    }

    const repositories = createSupabaseRepositories(supabaseClientResult.value)

    const schemaResult = await repositories.schema
      .getSchema(payload.designSessionId)
      .andThen((schema) => {
        const designProcessParams: AgentWorkflowParams = {
          ...payload,
          schemaData: schema.schema,
        }

        return invokeDbAgent(designProcessParams, { repositories })
      })

    if (schemaResult.isErr()) {
      throw schemaResult.error
    }
  },
})
