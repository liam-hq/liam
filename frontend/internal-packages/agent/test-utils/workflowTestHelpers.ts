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
  handleToolCallMessage,
} from '../src/streaming/server/handlers'

/**
 * Generate LangSmith thread_id search URL
 *
 * Note: This function depends on LangSmith's implicit behavior of recording thread_id as metadata.
 * When thread_id is set in LangChain RunnableConfig, LangSmith automatically records the following metadata:
 * - metadata_key: "thread_id"
 * - metadata_value: actual thread_id value
 *
 * If this implicit behavior changes, the generated URL may not be able to find traces.
 */
const generateLangSmithUrl = (threadId: string): string | null => {
  const organizationId = process.env['LANGSMITH_ORGANIZATION_ID']
  const projectId = process.env['LANGSMITH_PROJECT_ID']

  if (!organizationId || !projectId) {
    return null
  }

  const baseUrl = `https://smith.langchain.com/o/${organizationId}/projects/p/${projectId}`
  const filter = `and(eq(is_root, true), and(eq(metadata_key, "thread_id"), eq(metadata_value, "${threadId}")))`
  const searchModel = { filter }
  const encodedSearchModel = encodeURIComponent(JSON.stringify(searchModel))

  return `${baseUrl}?searchModel=${encodedSearchModel}`
}

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

  // Generate and log LangSmith trace URL if environment variables are set
  const langSmithUrl = generateLangSmithUrl(designSession.id)
  if (langSmithUrl) {
    logger.info(`LangSmith Trace URL: ${langSmithUrl}`)
  }

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
  const lastToolCallsContent = new Map<string, number>()

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
    handleToolCallMessage(message, messageId, lastToolCallsContent)
    handleRegularMessage(message, messageId, lastOutputContent)
  }
}
