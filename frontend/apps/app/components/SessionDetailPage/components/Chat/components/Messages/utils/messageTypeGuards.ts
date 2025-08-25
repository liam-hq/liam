import type { AIMessage, HumanMessage, Message } from '@langchain/langgraph-sdk'

export function isAiMessage(m: Message): m is AIMessage {
  return m.type === 'ai'
}

export function isHumanMessage(m: Message): m is HumanMessage {
  return m.type === 'human'
}
