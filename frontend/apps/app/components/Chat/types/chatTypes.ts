import type { ChatMessageProps } from '../../ChatMessage/ChatMessage'

/**
 * Represents a chat message entry with additional metadata
 */
export interface ChatEntry extends ChatMessageProps {
  /** Unique identifier for the message */
  id: string
  /** Database message ID for persistence */
  dbId?: string
}
