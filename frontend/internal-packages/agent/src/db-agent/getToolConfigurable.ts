import type { RunnableConfig } from '@langchain/core/runnables'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import type { Repositories } from '../repositories'
import { getConfigurable } from '../utils/getConfigurable'

const toolConfigurableSchema = v.object({
  buildingSchemaId: v.string(),
  latestVersionNumber: v.number(),
  designSessionId: v.string(),
})

export type ToolConfigurable = {
  repositories: Repositories
} & v.InferOutput<typeof toolConfigurableSchema>

export const getToolConfigurable = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  if (!config.configurable) {
    return err(new Error('Missing configurable object in RunnableConfig'))
  }

  const baseConfigurableResult = getConfigurable(config)
  if (baseConfigurableResult.isErr()) {
    return err(baseConfigurableResult.error)
  }
  const { repositories } = baseConfigurableResult.value

  const parsed = v.safeParse(toolConfigurableSchema, config.configurable)
  if (!parsed.success) {
    return err(
      new Error(
        `Invalid configurable object in RunnableConfig: ${parsed.issues.map((issue) => issue.message).join(', ')}`,
      ),
    )
  }

  return ok({
    repositories,
    ...parsed.output,
  })
}
