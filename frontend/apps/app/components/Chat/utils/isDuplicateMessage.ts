import type { ChatEntry } from '../types/chatTypes'

/**
 * Checks if a new message is a duplicate of existing messages
 * @param messages - Array of existing chat messages
 * @param newEntry - New message to check for duplication
 * @returns true if the message is a duplicate, false otherwise
 */
export const isDuplicateMessage = (
  messages: ChatEntry[],
  newEntry: ChatEntry,
): boolean => {
  const duplicateById = messages.some((msg) => msg.id === newEntry.id)
  if (duplicateById) {
    return true
  }

  if (newEntry.role === 'user') {
    const contentDuplicate = messages.some((msg) => {
      if (msg.role !== 'user' || msg.content !== newEntry.content) {
        return false
      }

      if (msg.timestamp && newEntry.timestamp) {
        const timeDiff = Math.abs(
          newEntry.timestamp.getTime() - msg.timestamp.getTime(),
        )
        return timeDiff < 5000 // 5 seconds tolerance
      }

      return true
    })

    if (contentDuplicate) {
      return true
    }
  }

  return false
}
