import {
  coerceMessageLikeToMessage,
  isBaseMessage,
} from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import {
  createLogger,
  setupDatabaseAndUser,
  validateEnvironment,
} from '../scripts/shared/scriptUtils'
import { findOrCreateDesignSession } from '../scripts/shared/sessionUtils'
import { MessageTupleManager } from '../src/streaming/core/MessageTupleManager'
import {
  isLangChainStreamEvent,
  isMetadataRecord,
} from '../src/streaming/core/typeGuards'
import {
  handleReasoningMessage,
  handleRegularMessage,
} from '../src/streaming/server/handlers'

/**
 * Gets the minimal configuration needed for integration tests
 * Directly sets up the test environment without creating unnecessary state
 */
export const getTestConfig = async (options?: {
  useOpenAI?: boolean
}): Promise<{
  config: RunnableConfig
  context: {
    buildingSchemaId: string
    latestVersionNumber: number
    designSessionId: string
    userId: string
    organizationId: string
  }
}> => {
  // Store original API key value to restore later
  const originalApiKey = process.env['OPENAI_API_KEY']

  // Provide dummy API key for tests that don't actually use OpenAI
  if (options?.useOpenAI === false && !process.env['OPENAI_API_KEY']) {
    process.env['OPENAI_API_KEY'] = 'dummy-key-for-testing'
  }

  const logger = createLogger('ERROR') // Only show errors during test setup

  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(findOrCreateDesignSession(undefined))

  // Restore original API key value to prevent leaking across tests
  if (originalApiKey === undefined) {
    delete process.env['OPENAI_API_KEY']
  } else {
    process.env['OPENAI_API_KEY'] = originalApiKey
  }

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

export const outputStreamEvents = async (
  stream: AsyncGenerator<unknown, void, unknown>,
): Promise<void> => {
  const messageManager = new MessageTupleManager()
  const lastOutputContent = new Map<string, string>()
  const lastReasoningContent = new Map<string, string>()

  for await (const ev of stream) {
    if (!isLangChainStreamEvent(ev)) continue
    if (ev.name !== 'messages') continue

    const [serialized, metadata] = [ev.data, ev.metadata]

    if (!isBaseMessage(serialized) || !isMetadataRecord(metadata)) {
      continue
    }

    const messageId = messageManager.add(serialized, metadata)
    if (!messageId) continue

    const result = messageManager.get(messageId)
    if (!result?.chunk) continue

    const message = coerceMessageLikeToMessage(result.chunk)

    handleReasoningMessage(message, messageId, lastReasoningContent)
    handleRegularMessage(message, messageId, lastOutputContent)
  }
}
