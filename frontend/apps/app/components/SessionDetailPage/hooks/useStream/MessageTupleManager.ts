import {
  type BaseMessage,
  type BaseMessageChunk,
  coerceMessageLikeToMessage,
  convertToChunk,
  isBaseMessageChunk,
} from '@langchain/core/messages'
import type { Message } from '@langchain/langgraph-sdk'

function tryConvertToChunk(message: BaseMessage) {
  try {
    return convertToChunk(message)
  } catch {
    return null
  }
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

  add(serialized: Message, metadata: Record<string, unknown> | undefined) {
    const message = coerceMessageLikeToMessage(serialized)
    const chunk = tryConvertToChunk(message)
    const { id } = chunk ?? message
    if (!id) return null

    this.chunks[id] ??= {}
    this.chunks[id].metadata = metadata ?? this.chunks[id].metadata
    if (chunk) {
      const prev = this.chunks[id].chunk
      this.chunks[id].chunk =
        (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk
      // NOTE: chunk.concat() always makes name undefined, so override it separately
      this.chunks[id].chunk.name = chunk.name
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
