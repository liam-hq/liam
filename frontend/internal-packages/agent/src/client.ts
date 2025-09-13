// Client-safe exports that can be used in browser environments

export { SSE_EVENTS } from './streaming/constants'
export { extractToolCallsFromMessage } from './streaming/core/extractToolCallsFromMessage'
export { MessageTupleManager } from './streaming/core/MessageTupleManager'
export { extractReasoningFromMessage } from './streaming/core/reasoningExtractor'
export type { ToolCall, ToolCalls } from './streaming/core/toolCallTypes'
