import type { ChatEntry } from '../types/chatTypes'

/**
 * Welcome message displayed when chat starts
 */
export const WELCOME_MESSAGE: ChatEntry = {
  id: 'welcome',
  content:
    'Hello! Feel free to ask questions about your schema or consult about database design.',
  isUser: false,
  timestamp: new Date(),
  isGenerating: false,
  agentType: 'ask',
}

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  GENERAL: 'Sorry, an error occurred. Please try again.',
  FETCH_FAILED: 'Failed to get response',
  RESPONSE_NOT_READABLE: 'Response body is not readable',
} as const
