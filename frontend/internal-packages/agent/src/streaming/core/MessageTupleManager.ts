import type { SerializedConstructor } from '@langchain/core/load/serializable'
import {
  type BaseMessage,
  type BaseMessageChunk,
  coerceMessageLikeToMessage,
  convertToChunk,
  isBaseMessageChunk,
  isToolMessage,
  ToolMessageChunk,
} from '@langchain/core/messages'

const tryConvertToChunk = (message: BaseMessage): BaseMessageChunk | null => {
  const result = convertToChunk(message)
  return result || null
}

type MessageTuple = {
  chunk?: BaseMessage | BaseMessageChunk
  metadata?: Record<string, unknown>
  index?: number
}

/**
 * NOTE: Mimics the useStream implementation from @langchain/langgraph-sdk
 * @see https://github.com/langchain-ai/langgraphjs/blob/3320793bffffa02682227644aefbee95dee330a2/libs/sdk/src/react/stream.tsx#L73-L134
 */
export class MessageTupleManager {
  private chunks: Record<string, MessageTuple>

  constructor() {
    this.chunks = {}
  }

  add(
    serialized: SerializedConstructor,
    metadata: Record<string, unknown> | undefined,
  ) {
    const message = coerceMessageLikeToMessage(serialized)

    // Handle ToolMessage separately since convertToChunk doesn't support it
    let chunk: BaseMessageChunk | null
    if (isToolMessage(message)) {
      chunk = new ToolMessageChunk(message)
    } else {
      chunk = tryConvertToChunk(message)
    }

    const { id } = chunk ?? message
    if (!id) return null

    this.chunks[id] ??= {}
    if (metadata) {
      this.chunks[id].metadata = metadata
    }
    if (chunk) {
      const prev = this.chunks[id].chunk
      this.chunks[id].chunk =
        (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk
      // NOTE: chunk.concat() always makes name undefined, so override it separately
      if (chunk.name !== undefined) {
        this.chunks[id].chunk.name = chunk.name
      }
    } else {
      this.chunks[id].chunk = message
    }

    return id
  }

  clear() {
    this.chunks = {}
  }

  get(id: string, defaultIndex?: number) {
    if (this.chunks[id] == null) return null
    if (defaultIndex != null) this.chunks[id].index ??= defaultIndex
    return this.chunks[id]
  }
}
