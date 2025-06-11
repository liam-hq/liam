import { PROGRESS_EMOJI_PATTERN } from '../constants/chatConstants'
import type { ChatEntry, ResponseChunk } from '../types/chatTypes'

/**
 * Helper function to create a ChatEntry from an existing message and additional properties
 */
export const createChatEntry = (
  baseMessage: ChatEntry,
  additionalProps: Partial<ChatEntry>,
): ChatEntry => {
  return { ...baseMessage, ...additionalProps }
}

/**
 * Type guard for parsed response chunks
 */
export const isResponseChunk = (value: unknown): value is ResponseChunk => {
  if (typeof value !== 'object' || value === null) return false

  // Check if the required properties exist
  if (!('type' in value) || !('content' in value)) return false

  // TypeScript now knows that value has 'type' and 'content' properties
  // We can access them safely using bracket notation
  const typeProperty = value['type']
  const contentProperty = value['content']

  return typeof typeProperty === 'string' && typeof contentProperty === 'string'
}

/**
 * Generate unique message ID
 */
export const generateMessageId = (prefix: string): string => {
  return `${prefix}-${Date.now()}`
}

/**
 * Format chat history for API
 */
export const formatChatHistory = (
  messages: ChatEntry[],
): [string, string][] => {
  return messages
    .filter((msg) => msg.id !== 'welcome' && msg.role !== 'error') // Exclude error messages from history
    .map((msg) => [msg.role === 'user' ? 'Human' : 'AI', msg.content])
}

/**
 * Update progress messages with new content
 * Ensures proper ordering and prevents premature completion status
 */
export const updateProgressMessages = (
  prev: string[],
  content: string,
): string[] => {
  // Extract the base message (without emoji status)
  const baseMessage = content.replace(PROGRESS_EMOJI_PATTERN, '')

  // Find if we already have a message for this step
  const existingIndex = prev.findIndex(
    (msg) => msg.replace(PROGRESS_EMOJI_PATTERN, '') === baseMessage,
  )

  if (existingIndex >= 0) {
    // Update existing message
    const updated = [...prev]
    updated[existingIndex] = content

    // If this is a completion (✅), ensure all previous steps are also completed
    if (content.includes('✅')) {
      for (let i = 0; i < existingIndex; i++) {
        const prevMessage = updated[i]
        const prevBaseMessage = prevMessage.replace(PROGRESS_EMOJI_PATTERN, '')
        // Only update if it's still in progress (🔄)
        if (prevMessage.includes('🔄')) {
          updated[i] = `${prevBaseMessage} ✅`
        }
      }
    }

    return updated
  }

  // Add new message
  return [...prev, content]
}
