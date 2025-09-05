import type { RunnableConfig } from '@langchain/core/runnables'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { WorkflowConfigurable } from '../types'

/**
 * Extract the configurable object from the RunnableConfig
 * Provides type safety and runtime validation using neverthrow
 */
export function getConfigurable(
  config: RunnableConfig,
): Result<WorkflowConfigurable, Error> {
  if (!config.configurable) {
    return err(new Error('Missing configurable object in RunnableConfig'))
  }

  const { repositories, thread_id } = config.configurable

  if (!repositories) {
    return err(new Error('Missing repositories in configurable object'))
  }

  if (!thread_id) {
    return err(new Error('Missing thread_id in configurable object'))
  }

  return ok({
    repositories,
    thread_id,
  })
}
