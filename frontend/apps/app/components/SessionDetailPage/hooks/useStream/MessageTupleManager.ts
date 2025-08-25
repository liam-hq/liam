import {
  type BaseMessage,
  type BaseMessageChunk,
  type BaseMessageLike,
  coerceMessageLikeToMessage,
  convertToChunk,
  isBaseMessageChunk,
} from '@langchain/core/messages'

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

  add(serialized: BaseMessageLike, metadata: Record<string, unknown>) {
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
    } else {
      this.chunks[id].chunk = message
    }

    return id
  }

  clear() {
    this.chunks = {}
  }

  get(id: string, defaultIndex?: number) {
    const entry = this.chunks[id]
    if (entry == null) return null

    if (defaultIndex !== null && entry.index == null) {
      entry.index = defaultIndex ?? 0
    }

    return entry
  }
}
