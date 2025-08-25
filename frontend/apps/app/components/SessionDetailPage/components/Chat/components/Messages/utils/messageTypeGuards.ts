import type { AIMessage, Message } from '@langchain/langgraph-sdk'

export function isAiMessage(m: Message): m is AIMessage {
  return m.type === 'ai'
}
