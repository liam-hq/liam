import { load } from '@langchain/core/load'
import {
  AIMessageChunk,
  type BaseMessage,
  type BaseMessageChunk,
  isAIMessageChunk,
  isBaseMessageChunk,
  isToolMessageChunk,
  ToolMessageChunk,
} from '@langchain/core/messages'

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

  async add(data: string) {
    const parsed = JSON.parse(data)
    const [serialized, metadata] = parsed

    let chunk: AIMessageChunk | ToolMessageChunk | null = null
    const loaded = await load<BaseMessageChunk>(JSON.stringify(serialized))
    if (isToolMessageChunk(loaded)) {
      chunk = new ToolMessageChunk(loaded)
    } else if (isAIMessageChunk(loaded)) {
      chunk = new AIMessageChunk(loaded)
    }

    if (!chunk) return null

    const { id } = chunk
    if (!id) return null

    this.chunks[id] ??= {}
    if (metadata) {
      this.chunks[id].metadata = metadata
    }

    const prev = this.chunks[id].chunk
    this.chunks[id].chunk =
      (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk

    // NOTE: chunk.concat() always makes name undefined, so override it separately
    if (chunk.name !== undefined) {
      this.chunks[id].chunk.name = chunk.name
    }

    // NOTE: reasoning metadata needs to be updated with each chunk
    if (chunk.additional_kwargs?.['reasoning_duration_ms'] !== undefined) {
      this.chunks[id].chunk.additional_kwargs['reasoning_duration_ms'] =
        chunk.additional_kwargs['reasoning_duration_ms']
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
