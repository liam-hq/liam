import type { Database } from '@liam-hq/db/supabase/database.types'

// Use the database enum type for role
type MessageRole = Database['public']['Enums']['message_role_enum']

/**
 * Represents a chat message entry with role-based typing
 */
export interface ChatEntry {
  /** Unique identifier for the message */
  id: string
  /** Database message ID for persistence */
  dbId?: string
  /** Message role (user, assistant, error) */
  role: MessageRole
  /** Message content */
  content: string
  /** Whether the bot is generating a response */
  isGenerating?: boolean
  /** Message timestamp */
  timestamp?: Date
  /** Avatar source URL */
  avatarSrc?: string
  /** Avatar alt text */
  avatarAlt?: string
  /** Avatar initial text */
  initial?: string
  /** Optional children to render below the message content */
  children?: React.ReactNode
  /** Progress messages to display above the main message */
  progressMessages?: string[]
  /** Whether to show progress messages */
  showProgress?: boolean
}

// Type guards for different message roles
export const isUserMessage = (message: ChatEntry): boolean => {
  return message.role === 'user'
}

export const isAgentMessage = (message: ChatEntry): boolean => {
  return message.role === 'assistant'
}

export const isErrorMessage = (message: ChatEntry): boolean => {
  return message.role === 'error'
}

/**
 * Type guard for streaming response chunks
 */
export interface ResponseChunk {
  type: string
  content: string
}
