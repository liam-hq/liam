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
import * as v from 'valibot'
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

// Reasoning message extraction (copied from UI utils)
const summaryItemSchema = v.object({
  type: v.literal('summary_text'),
  text: v.string(),
  index: v.number(),
})

const reasoningSchema = v.object({
  id: v.string(),
  type: v.literal('reasoning'),
  summary: v.array(summaryItemSchema),
})

const additionalKwargsSchema = v.object({
  reasoning: v.optional(reasoningSchema),
})

function extractReasoningFromMessage(message: BaseMessage): string | null {
  const parsed = v.safeParse(additionalKwargsSchema, message.additional_kwargs)
  if (!parsed.success || !parsed.output.reasoning) return null

  const { summary } = parsed.output.reasoning
  return summary
    .map((s) => s.text || '')
    .filter(Boolean)
    .join('\n\n')
}

function handleReasoningMessage(
  message: BaseMessage,
  messageId: string,
  lastReasoningContent: Map<string, string>,
): void {
  const currentReasoningText = extractReasoningFromMessage(message) || ''
  const lastReasoningText = lastReasoningContent.get(messageId) || ''

  if (currentReasoningText && currentReasoningText !== lastReasoningText) {
    const newReasoningContent = currentReasoningText.slice(
      lastReasoningText.length,
    )
    if (newReasoningContent) {
      const name = 'name' in message && message.name ? ` (${message.name})` : ''
      const reasoningPrefix = lastReasoningText ? '' : `🧠 Reasoning${name}: `
      process.stdout.write(`${reasoningPrefix}${newReasoningContent}\n\n`)
      lastReasoningContent.set(messageId, currentReasoningText)
    }
  }
}

function handleRegularMessage(
  message: BaseMessage,
  messageId: string,
  lastOutputContent: Map<string, string>,
): void {
  const currentContent = message.text
  const lastContent = lastOutputContent.get(messageId) || ''

  const newContent = currentContent.slice(lastContent.length)
  if (!newContent) return

  lastOutputContent.set(messageId, currentContent)

  const formattedOutput = formatStreamingMessage(
    message,
    newContent,
    !lastContent,
  )

  process.stdout.write(formattedOutput)
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
