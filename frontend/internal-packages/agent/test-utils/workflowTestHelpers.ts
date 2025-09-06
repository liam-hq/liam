import type { RunnableConfig } from '@langchain/core/runnables'
import {
  createLogger,
  getLogLevel,
  setupDatabaseAndUser,
  validateEnvironment,
} from '../scripts/shared/scriptUtils'
import { findOrCreateDesignSession } from '../scripts/shared/sessionUtils'
import { processStreamChunk } from '../scripts/shared/streamingUtils'

/**
 * Processes and outputs the stream from a workflow execution
 * Encapsulates the streaming and logging logic
 */
export const outputStream = async <T extends Record<string, unknown>>(
  stream: AsyncGenerator<T, void, unknown>,
  logLevel: 'ERROR' | 'INFO' | 'DEBUG' | 'WARN' = getLogLevel(),
): Promise<void> => {
  const logger = createLogger(logLevel)

  for await (const chunk of stream) {
    // Find the first non-null node output in the chunk
    const nodeOutput = Object.values(chunk).find((value) => value !== undefined)
    if (nodeOutput) {
      processStreamChunk(logger, nodeOutput)
    }
  }
}

/**
 * Gets the minimal configuration needed for integration tests
 * Directly sets up the test environment without creating unnecessary state
 */
export const getTestConfig = async (): Promise<{
  config: RunnableConfig
  context: {
    buildingSchemaId: string
    latestVersionNumber: number
    designSessionId: string
    userId: string
    organizationId: string
  }
}> => {
  const logger = createLogger('ERROR') // Only show errors during test setup

  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(findOrCreateDesignSession(undefined))

  if (setupResult.isErr()) {
    throw setupResult.error
  }

  const { organization, buildingSchema, designSession, user, repositories } =
    setupResult.value

  return {
    config: {
      configurable: {
        repositories,
        thread_id: designSession.id,
      },
    },
    context: {
      buildingSchemaId: buildingSchema.id,
      latestVersionNumber: buildingSchema.latest_version_number,
      designSessionId: designSession.id,
      userId: user.id,
      organizationId: organization.id,
    },
  }
}
