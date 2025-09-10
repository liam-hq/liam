import {
  type BaseMessage,
  type BaseMessageChunk,
  coerceMessageLikeToMessage,
  convertToChunk,
  isBaseMessage,
  isBaseMessageChunk,
  isToolMessage,
  ToolMessageChunk,
} from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { err, ok, type Result } from 'neverthrow'
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

function tryConvertToChunk(
  message: BaseMessage,
): Result<BaseMessageChunk, Error> {
  const result = convertToChunk(message)
  return result ? ok(result) : err(new Error('Failed to convert to chunk'))
}

type MessageTuple = {
  chunk?: BaseMessage | BaseMessageChunk
  metadata?: Record<string, unknown>
  index?: number
}

class SimpleMessageManager {
  private chunks: Record<string, MessageTuple>

  constructor() {
    this.chunks = {}
  }

  add(serialized: BaseMessage, metadata: Record<string, unknown> | undefined) {
    const message = coerceMessageLikeToMessage(serialized)
    const chunk = this.convertMessageToChunk(message)

    const { id } = chunk ?? message
    if (!id) return null

    this.chunks[id] ??= {}
    const currentChunk = this.chunks[id]

    if (currentChunk && metadata) {
      currentChunk.metadata = metadata
    }

    this.updateChunk(currentChunk, chunk, message)
    return id
  }

  private convertMessageToChunk(message: BaseMessage): BaseMessageChunk | null {
    if (isToolMessage(message)) {
      return new ToolMessageChunk(message)
    }

    const chunkResult = tryConvertToChunk(message)
    return chunkResult.isOk() ? chunkResult.value : null
  }

  private updateChunk(
    currentChunk: MessageTuple | undefined,
    chunk: BaseMessageChunk | null,
    message: BaseMessage,
  ) {
    if (!currentChunk) return

    if (chunk && isBaseMessageChunk(chunk)) {
      if (currentChunk.chunk && isBaseMessageChunk(currentChunk.chunk)) {
        currentChunk.chunk = currentChunk.chunk.concat(chunk)
      } else {
        currentChunk.chunk = chunk
      }
    } else {
      currentChunk.chunk = message
    }
  }

  get(messageId: string): MessageTuple | undefined {
    return this.chunks[messageId]
  }
}

/**
 * Processes and outputs LangChain streamEvents from agent workflows
 */

function formatStreamingMessage(
  message: BaseMessage,
  newContent: string,
  isFirstChunk: boolean,
): string {
  const messageType = message._getType().toLowerCase()

  switch (messageType) {
    case 'human':
      return isFirstChunk ? `> ${newContent}` : newContent
    case 'ai':
      return formatAIMessage(message, newContent, isFirstChunk)
    case 'tool':
      return formatToolMessage(message, newContent, isFirstChunk)
    default:
      return isFirstChunk ? `${messageType}: ${newContent}` : newContent
  }
}

function formatAIMessage(
  message: BaseMessage,
  newContent: string,
  isFirstChunk: boolean,
): string {
  const name = 'name' in message && message.name ? ` (${message.name})` : ''
  return isFirstChunk ? `⏺ ${name}: ${newContent}` : newContent
}

function formatToolMessage(
  message: BaseMessage,
  newContent: string,
  isFirstChunk: boolean,
): string {
  const toolName = 'name' in message && message.name ? message.name : 'unknown'
  return isFirstChunk ? `  ⎿ ${toolName}: ${newContent}` : newContent
}

function isMetadataRecord(
  value: unknown,
): value is Record<string, unknown> | undefined {
  return (
    value === undefined ||
    (typeof value === 'object' && value !== null && !Array.isArray(value))
  )
}

function isLangChainStreamEvent(
  value: unknown,
): value is { event: string; name: string; data: unknown; metadata: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    value.event === 'on_custom_event' &&
    'name' in value &&
    'data' in value &&
    'metadata' in value
  )
}

export const outputStreamEvents = async (
  stream: AsyncGenerator<unknown, void, unknown>,
): Promise<void> => {
  const messageManager = new SimpleMessageManager()
  const lastOutputContent = new Map<string, string>()

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
    const currentContent = message.text
    const lastContent = lastOutputContent.get(messageId) || ''

    const newContent = currentContent.slice(lastContent.length)
    if (!newContent) continue

    lastOutputContent.set(messageId, currentContent)

    const formattedOutput = formatStreamingMessage(
      message,
      newContent,
      !lastContent,
    )

    process.stdout.write(formattedOutput)
  }
}
